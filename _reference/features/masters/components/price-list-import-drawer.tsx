/**
 * Price List CSV/Excel import drawer (feature 070, US5).
 *
 * Mirrors the product-import drawer (058): the file is parsed client-side into
 * JSON rows POSTed to /admin/masters/price-list/import — no raw file upload.
 * The PIVOTED legacy layout is understood directly:
 *   header  = Product Name | (optional) Size | <pack label> | <pack label> | …
 *   data row = one product; `---`/blank price cells mean "pack not offered".
 * Sr.-No-style columns are ignored. Matching (exact name-or-SKU) happens
 * server-side; unmatched/ambiguous/duplicate rows come back in `errors`.
 */
import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUp, Download } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { normalizeUom } from '../../../utils/uom';
import { useAdminImportPriceList } from '../../../sdk/inventory';
import type { ImportPriceListResponse, ImportPriceListRow } from '../../../sdk/schemas';
import { downloadPriceListSampleCsv } from '../api/price-list';

const MAX_ROWS = 500;

export interface PriceListImportDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called after a clean import (nothing failed); the parent refetches. */
  onSuccess: () => void;
}

interface ParsedRow {
  product: string;
  size: string;
  entries: { pack_label: string; price: number }[];
  warnings: string[];
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim();
}

/** "500 gm" → "500 GM"; "1KG" → "1 KG"; unrecognised labels pass through.
 * Uses the shared UOM vocabulary (utils/uom) so imported pack labels match
 * drawer-generated ones and link cleanly to sales-order packs. */
function normalizePackLabel(label: string): string {
  const m = /^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/.exec(label.trim());
  if (!m) return label.trim();
  return `${m[1]} ${normalizeUom(m[2])}`;
}

function isSkippableHeader(h: string): boolean {
  const low = h.toLowerCase().replace(/\s+/g, ' ');
  return low === '' || low.startsWith('sr') || low === '#' || low === 'no' || low === 'no.';
}

function parseSheet(rows: unknown[][]): { rows: ParsedRow[]; error: string | null } {
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmpty.length < 2) return { rows: [], error: 'File has no data rows.' };

  const header = nonEmpty[0].map(normalizeHeader);
  const lower = header.map((h) => h.toLowerCase().replace(/\s+/g, ' '));
  const iProduct = lower.findIndex((h) => h.includes('product'));
  if (iProduct < 0) return { rows: [], error: 'Missing required column: Product Name.' };
  const iSize = lower.findIndex((h) => h === 'size');

  // Every remaining, non-skippable column is a pack label (dynamic — the whole
  // point); unit spellings are normalized to the shared UOM vocabulary.
  const packCols: { index: number; label: string }[] = header
    .map((label, index) => ({ index, label: normalizePackLabel(label) }))
    .filter(
      ({ index, label }) =>
        index !== iProduct && index !== iSize && !isSkippableHeader(label),
    );
  if (packCols.length === 0)
    return { rows: [], error: 'No pack/price columns found (e.g. "1 KG", "500 GM").' };

  const dataRows = nonEmpty.slice(1);
  if (dataRows.length > MAX_ROWS)
    return {
      rows: [],
      error: `File has ${dataRows.length} rows; the limit is ${MAX_ROWS}. Split the file and try again.`,
    };

  const parsed: ParsedRow[] = dataRows.map((row) => {
    const product = String(row[iProduct] ?? '').trim();
    const size = iSize >= 0 ? String(row[iSize] ?? '').trim() : '';
    const warnings: string[] = [];
    const entries: ParsedRow['entries'] = [];
    for (const { index, label } of packCols) {
      const raw = String(row[index] ?? '').trim();
      if (!raw || raw === '---' || raw === '--' || raw === '-') continue; // pack not offered
      const price = Number(raw.replace(/[₹,\s]/g, ''));
      if (Number.isNaN(price) || price <= 0) {
        warnings.push(`${label}: "${raw}" is not a valid price`);
        continue;
      }
      entries.push({ pack_label: label, price });
    }
    if (!product) warnings.push('Product name is required');
    if (entries.length === 0) warnings.push('No pack prices on this row');
    return { product, size, entries, warnings };
  });

  return { rows: parsed, error: null };
}

function toApiRow(r: ParsedRow): ImportPriceListRow {
  return {
    product: r.product,
    size_label: r.size || null,
    entries: r.entries,
  };
}

export function PriceListImportDrawer({ open, onClose, onSuccess }: PriceListImportDrawerProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [resultErrors, setResultErrors] = useState<string[]>([]);

  const validRows = rows.filter((r) => r.warnings.length === 0);
  const invalidRows = rows.filter((r) => r.warnings.length > 0);

  const importMutation = useAdminImportPriceList({
    mutation: {
      onSuccess: (resp) => {
        const data = (resp as { data: ImportPriceListResponse }).data;
        const failed = invalidRows.length + data.errors.length;
        const parts: string[] = [];
        if (data.imported) parts.push(`${data.imported} imported`);
        if (failed) parts.push(`${failed} failed`);
        toast({
          severity: failed ? 'warning' : 'success',
          message: parts.length ? parts.join(', ') + '.' : 'Nothing to import.',
        });
        if (failed) {
          setResultErrors([
            ...invalidRows.map((r) => `${r.product || '(no name)'}: ${r.warnings.join('; ')}`),
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
    setRows([]);
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
      const { rows: parsed, error } = parseSheet(raw);
      if (error) setParseError(error);
      else setRows(parsed);
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
      title="Import Price List"
      open={open}
      onClose={handleClose}
      drawerWidth="48rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="mb-1 text-sm font-medium text-foreground">Download sample template</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Same layout as your sheets: <span className="font-mono">Product Name, Size, then one
              column per pack</span> (any labels — 1 KG, 500 GM, Akhand, …). Use{' '}
              <span className="font-mono">---</span> or leave blank when a pack isn’t offered.
              Products are matched by exact name or SKU.
            </p>
            <button
              type="button"
              onClick={() =>
                downloadPriceListSampleCsv().catch(() =>
                  toast({ severity: 'error', message: 'Failed to download sample CSV.' }),
                )
              }
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
            >
              <Download className="size-4" /> Sample CSV
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Upload CSV or Excel file</p>
            <label
              htmlFor="price-list-import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/10 p-8 text-center transition-colors hover:bg-muted/20"
            >
              <FileUp className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select a <strong>.csv</strong> or <strong>.xlsx</strong> file
              </span>
              <input
                id="price-list-import-file"
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

          {parseError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-line">
              {parseError}
            </div>
          )}

          {invalidRows.length > 0 && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="mb-1 font-medium">{invalidRows.length} row(s) will be skipped:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {invalidRows.slice(0, 5).map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.product || '(no name)'}</span> — {r.warnings.join('; ')}
                  </li>
                ))}
                {invalidRows.length > 5 && <li>…and {invalidRows.length - 5} more</li>}
              </ul>
            </div>
          )}

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

          {rows.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Preview — {rows.length} row(s), {validRows.length} ready to import
              </p>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left">Product</th>
                      <th className="px-2 py-1 text-left">Size</th>
                      <th className="px-2 py-1 text-left">Pack prices</th>
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
                        <td className="px-2 py-0.5 font-medium">
                          {r.product || <span className="text-destructive">(missing)</span>}
                        </td>
                        <td className="px-2 py-0.5">{r.size}</td>
                        <td className="px-2 py-0.5">
                          {r.entries.map((e) => `${e.pack_label} ₹${e.price}`).join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
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

export default PriceListImportDrawer;
