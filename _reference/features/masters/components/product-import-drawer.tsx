/**
 * Product CSV/Excel import drawer (feature 058).
 *
 * Mirrors BomImportDrawer: the file is parsed client-side (PapaParse for CSV,
 * xlsx for Excel) into JSON rows that are POSTed to /admin/masters/products/
 * import-csv — no raw file upload. Columns map one-for-one to the Add-product
 * form: SKU, Name, Category, HSN, Unit, Shelf life (months).
 *
 * Rows that fail client-side validation are shown as warnings and NOT sent
 * (reported as "failed"); only clean rows are imported. The backend is the
 * authoritative backstop and additionally skips duplicate SKUs.
 */
import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUp, Download } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminImportProductsCsv } from '../../../sdk/inventory';
import type { ImportProductRow, ImportProductsResponse } from '../../../sdk/schemas';
import { normalizeUom, UOM_VALUES } from '../../../utils/uom';
import { useProductCategories } from '../hooks/use-product-categories';
import { downloadProductSampleCsv } from '../api/products';

// Unit must resolve to a standard UOM value (same list the Add-product drawer
// offers) — legacy spellings like "bottle"/"gram" normalise to BTL/GM.
const isKnownUom = (v: string) => (UOM_VALUES as readonly string[]).includes(normalizeUom(v));

export interface ProductImportDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called after a clean import (nothing failed); the parent refetches the list. */
  onSuccess: () => void;
}

interface ParsedRow {
  sku: string;
  name: string;
  category: string;
  hsn: string;
  unit: string;
  shelf: string;
  reorder: string;
  /** Client-side validation messages; a row with any warning is not imported. */
  warnings: string[];
}

const MAX_ROWS = 1000;
const SKU_RE = /^[A-Z0-9][A-Z0-9_-]*$/;

// Header aliases (normalized: lowercased, whitespace-collapsed). Matched by name,
// not position; unrecognized columns are ignored.
const COL_ALIASES: Record<keyof Omit<ParsedRow, 'warnings'>, string[]> = {
  name: ['name', 'product name', 'product'],
  sku: ['sku', 'code', 'product code'],
  category: ['category'],
  hsn: ['hsn', 'hsn code'],
  unit: ['unit', 'pack size', 'pack', 'pack_size'],
  shelf: ['shelf life (months)', 'shelf life', 'shelf life months', 'shelf_life_months', 'shelf life (month)'],
  reorder: ['re-order level', 'reorder level', 'reorder_level', 'reorder', 're-order', 'reorder point', 'low-stock threshold'],
};

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cellAt(row: unknown[], idx: number): string {
  if (idx < 0) return '';
  return String(row[idx] ?? '').trim();
}

type RawRow = Omit<ParsedRow, 'warnings'>;

/**
 * Per-row client-side validation. `categorySet` is the set of managed Product
 * Category names (lower-cased); `categoriesReady` is false while that list is
 * still loading, so we don't flag categories before we can check them.
 */
function rowWarnings(r: RawRow, categorySet: Set<string>, categoriesReady: boolean): string[] {
  const w: string[] = [];
  if (!r.name) w.push('Name is required');
  if (r.sku && !SKU_RE.test(r.sku)) w.push('SKU must be uppercase letters, numbers, - or _ (no spaces)');
  if (r.shelf && !/^\d+$/.test(r.shelf)) w.push('Shelf life must be a whole number ≥ 0');
  // Category, when given, must be an existing managed Product Category (same list
  // the Add-product drawer offers) — unknown categories are not created here.
  if (r.category && categoriesReady && !categorySet.has(r.category.toLowerCase()))
    w.push(`Category "${r.category}" is not in Product Categories — add it under Manage Categories first`);
  // Unit + Re-order level are mandatory (mirrors the Add-product drawer).
  if (!r.unit) w.push('Unit is required');
  else if (!isKnownUom(r.unit)) w.push(`Unit must be one of: ${UOM_VALUES.join(', ')}`);
  if (!r.reorder) w.push('Re-order level is required');
  else if (Number.isNaN(Number(r.reorder)) || Number(r.reorder) < 0)
    w.push('Re-order level must be a number ≥ 0');
  return w;
}

function parseRows(rows: unknown[][]): { rows: RawRow[]; error: string | null } {
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmpty.length < 2) return { rows: [], error: 'File has no data rows.' };

  const header = nonEmpty[0].map(normalizeHeader);
  const indexOf = (key: keyof typeof COL_ALIASES) =>
    header.findIndex((h) => COL_ALIASES[key].includes(h));

  const iName = indexOf('name');
  if (iName < 0) return { rows: [], error: 'Missing required column: Name.' };

  const idx = {
    sku: indexOf('sku'),
    name: iName,
    category: indexOf('category'),
    hsn: indexOf('hsn'),
    unit: indexOf('unit'),
    shelf: indexOf('shelf'),
    reorder: indexOf('reorder'),
  };

  const dataRows = nonEmpty.slice(1);
  if (dataRows.length > MAX_ROWS)
    return { rows: [], error: `File has ${dataRows.length} rows; the limit is ${MAX_ROWS}. Split the file and try again.` };

  const parsed: RawRow[] = dataRows.map((row) => ({
    sku: cellAt(row, idx.sku),
    name: cellAt(row, iName),
    category: cellAt(row, idx.category),
    hsn: cellAt(row, idx.hsn),
    unit: cellAt(row, idx.unit),
    shelf: cellAt(row, idx.shelf),
    reorder: cellAt(row, idx.reorder),
  }));

  return { rows: parsed, error: null };
}

function toApiRow(r: ParsedRow): ImportProductRow {
  return {
    name: r.name || null,
    code: r.sku || null,
    category: r.category || null,
    hsn: r.hsn || null,
    // Normalise the unit to the canonical UOM abbreviation (KG, BTL, …).
    pack_size: r.unit ? normalizeUom(r.unit) : null,
    shelf_life_months: r.shelf ? Number(r.shelf) : null,
    reorder_level: r.reorder ? Number(r.reorder) : null,
  };
}

export function ProductImportDrawer({ open, onClose, onSuccess }: ProductImportDrawerProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [resultErrors, setResultErrors] = useState<string[]>([]);

  // The managed Product Categories (same list the Add-product drawer offers). An
  // imported Category must already exist here; unknown categories are rejected.
  const { categories, isLoading: categoriesLoading } = useProductCategories({
    page: 0,
    pageSize: 100,
    sort: 'name',
    activeOnly: true,
  });
  const categorySet = useMemo(
    () => new Set(categories.map((c) => c.name.trim().toLowerCase())),
    [categories],
  );
  const categoriesReady = !categoriesLoading;

  // Warnings depend on the async category list, so derive rows reactively.
  const rows = useMemo<ParsedRow[]>(
    () => rawRows.map((r) => ({ ...r, warnings: rowWarnings(r, categorySet, categoriesReady) })),
    [rawRows, categorySet, categoriesReady],
  );

  const validRows = useMemo(() => rows.filter((r) => r.warnings.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => r.warnings.length > 0), [rows]);

  const importMutation = useAdminImportProductsCsv({
    mutation: {
      onSuccess: (resp) => {
        const data = (resp as { data: ImportProductsResponse }).data;
        const clientFailed = invalidRows.length;
        const failed = clientFailed + data.errors.length;
        const parts: string[] = [];
        if (data.created) parts.push(`${data.created} created`);
        if (data.skipped) parts.push(`${data.skipped} skipped (already exist)`);
        if (failed) parts.push(`${failed} failed`);
        const message = parts.length ? parts.join(', ') + '.' : 'Nothing to import.';
        toast({ severity: failed ? 'warning' : 'success', message });

        if (failed) {
          // Keep the drawer open so the user can fix the flagged rows and re-import.
          setResultErrors([
            ...invalidRows.map((r) => `${r.name || 'row'}: ${r.warnings.join('; ')}`),
            ...data.errors,
          ]);
        } else {
          handleClose();
          onSuccess();
        }
      },
      onError: (err) => toast({ severity: 'error', message: errorMessage(err) }),
    },
  });

  const reset = () => {
    setParseError(null);
    setRawRows([]);
    setResultErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File) => {
    reset();
    const process = (raw: unknown[][]) => {
      const { rows: parsed, error } = parseRows(raw);
      if (error) {
        setParseError(error);
        return;
      }
      setRawRows(parsed);
    };

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          process(XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]);
        } catch {
          setParseError('Failed to parse Excel file. Please use the sample CSV format.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse<unknown[]>(file, {
        complete: (res) => process(res.data as unknown[][]),
        error: () => setParseError('Failed to parse CSV. Please use the sample CSV format.'),
        skipEmptyLines: false,
      });
    }
  };

  const handleImport = () => {
    if (!validRows.length) return;
    setResultErrors([]);
    importMutation.mutate({ data: { rows: validRows.map(toApiRow) } });
  };

  return (
    <CustomDrawer
      anchor="right"
      title="Import Products"
      open={open}
      onClose={handleClose}
      drawerWidth="48rem"
    >
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-0.5">
          {/* Sample download */}
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="mb-1 text-sm font-medium text-foreground">Download sample template</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Columns:{' '}
              <span className="font-mono">SKU, Name, Category, HSN, Unit, Shelf life (months), Re-order level</span>
              {' '}— <strong>Name</strong>, <strong>Unit</strong> and <strong>Re-order level</strong> are required; a blank SKU is auto-generated.
            </p>
            <button
              type="button"
              onClick={() =>
                downloadProductSampleCsv().catch(() =>
                  toast({ severity: 'error', message: 'Failed to download sample CSV.' }),
                )
              }
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
            >
              <Download className="size-4" /> Sample CSV
            </button>
          </div>

          {/* Upload */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Upload CSV or Excel file</p>
            <label
              htmlFor="product-import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/10 p-8 text-center transition-colors hover:bg-muted/20"
            >
              <FileUp className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select a <strong>.csv</strong> or <strong>.xlsx</strong> file
              </span>
              <input
                id="product-import-file"
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>

          {/* Fatal parse error */}
          {parseError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-line">
              {parseError}
            </div>
          )}

          {/* Row-level validation warnings (rows that will NOT be imported) */}
          {invalidRows.length > 0 && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="mb-1 font-medium">
                {invalidRows.length} row(s) will be skipped (fix and re-upload):
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                {invalidRows.slice(0, 5).map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.name || '(no name)'}</span> — {r.warnings.join('; ')}
                  </li>
                ))}
                {invalidRows.length > 5 && <li>…and {invalidRows.length - 5} more</li>}
              </ul>
            </div>
          )}

          {/* Server-reported failures after an import attempt */}
          {resultErrors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="mb-1 font-medium">Some rows were not imported:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {resultErrors.slice(0, 8).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {resultErrors.length > 8 && <li>…and {resultErrors.length - 8} more</li>}
              </ul>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Preview — {rows.length} row(s), {validRows.length} ready to import
              </p>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left">SKU</th>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Category</th>
                      <th className="px-2 py-1 text-left">HSN</th>
                      <th className="px-2 py-1 text-left">Unit</th>
                      <th className="px-2 py-1 text-right">Shelf life</th>
                      <th className="px-2 py-1 text-right">Re-order level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.warnings.length
                            ? 'border-t border-border/40 bg-yellow-50'
                            : 'border-t border-border/40 even:bg-muted/10'
                        }
                        title={r.warnings.join('; ')}
                      >
                        <td className="px-2 py-0.5 font-mono">{r.sku || <span className="text-muted-foreground">auto</span>}</td>
                        <td className="px-2 py-0.5 font-medium">{r.name || <span className="text-destructive">(missing)</span>}</td>
                        <td className="px-2 py-0.5">{r.category}</td>
                        <td className="px-2 py-0.5 font-mono">{r.hsn}</td>
                        <td className="px-2 py-0.5">{r.unit}</td>
                        <td className="px-2 py-0.5 text-right">{r.shelf}</td>
                        <td className="px-2 py-0.5 text-right">{r.reorder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pinned actions */}
        <div className="mt-3 flex shrink-0 justify-end gap-3 border-t border-border pt-3">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton
            type="button"
            variant="primary"
            onClick={handleImport}
            disabled={!validRows.length}
            loading={importMutation.isPending}
          >
            Import {validRows.length || ''}
          </CustomButton>
        </div>
      </div>
    </CustomDrawer>
  );
}

export default ProductImportDrawer;
