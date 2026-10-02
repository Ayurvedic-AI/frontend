/**
 * BOM Template CSV/Excel import drawer.
 *
 * Simplified format (matches the Add/Edit Template drawer):
 *   Product Name, Material, Quantity
 *   Ampachak Vati, Haritaki Churna, 1.883
 *   Ampachak Vati, Kuchala Shuddh, 1.883
 *   ...
 *
 * Rows sharing the same Product Name group into one template. The Unit is
 * derived from the matched Raw Material and the template code is auto-generated
 * (IMP-NNNN) — neither is a column.
 *
 * VALIDATION: a row's Product Name must match an existing Product and every
 * Material an existing Raw Material — the same records the Add/Edit Template
 * drawer offers in its dropdowns. Unmatched templates are NOT imported and are
 * listed with the reason. Matched rows link to the real product (product_id)
 * and raw materials (raw_material_id), exactly like the drawer.
 */
import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileUp, Download } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { cn } from '../../../lib/cn';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminImportBomsCsv } from '../../../sdk/inventory';
import { useProducts } from '../hooks/useProducts';
import { useRawMaterials } from '../hooks/useRawMaterials';
import { downloadFile } from '../../../api/download';
import { normalizeUom } from '../../../utils/uom';

interface ParsedLine {
  material: string;    // Material (raw-material name) or free-text ingredient
  quantity: string;    // Quantity (free text — e.g. "Q.S.")
  section: BomLineSection; // resolved from the optional Section column
  sheetUnit: string;   // optional Unit column (ingredient sections only)
}

type BomLineSection = 'RAW_MATERIAL' | 'FIXED_MATERIAL' | 'INGREDIENT_FIXED' | 'INGREDIENT_SCALED';

// Optional Section column tokens → canonical section. Blank = Section A.
const SECTION_TOKENS: Record<string, BomLineSection> = {
  '': 'RAW_MATERIAL',
  'a': 'RAW_MATERIAL', 'section a': 'RAW_MATERIAL', 'scaled': 'RAW_MATERIAL',
  'b': 'FIXED_MATERIAL', 'section b': 'FIXED_MATERIAL', 'fixed': 'FIXED_MATERIAL',
  'ingredient': 'INGREDIENT_FIXED', 'ingredient fixed': 'INGREDIENT_FIXED', 'c': 'INGREDIENT_FIXED',
  'exponential': 'INGREDIENT_SCALED', 'ingredient scaled': 'INGREDIENT_SCALED', 'd': 'INGREDIENT_SCALED',
};
const INGREDIENT_SECTIONS: BomLineSection[] = ['INGREDIENT_FIXED', 'INGREDIENT_SCALED'];

interface ParsedTemplate {
  name: string;        // Product Name
  lines: ParsedLine[];
}

/** A parsed template resolved against the catalog: ids + derived unit when
 *  matched, plus the reasons it cannot be imported. */
interface ValidatedLine extends ParsedLine {
  rawMaterialId: number | null;
  unit: string;        // derived from the matched raw material
}
interface ValidatedTemplate {
  name: string;
  productId: number | null;
  lines: ValidatedLine[];
  issues: string[];
  valid: boolean;
}

export interface BomImportDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPECTED_HEADERS = ['product name', 'material', 'quantity'];

/** Numeric quantities preview at 2 decimals; free-text weights (e.g. "Q.S.") pass through. */
function fmtPreviewQty(raw: string): string {
  const n = Number(raw.trim());
  return raw.trim() !== '' && Number.isFinite(n) ? n.toFixed(2) : raw;
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseRows(rows: string[][]): { templates: ParsedTemplate[]; errors: string[] } {
  const errors: string[] = [];
  if (rows.length < 2) {
    return { templates: [], errors: ['File has no data rows.'] };
  }

  // Detect header row
  const headerRow = rows[0].map(normalizeHeader);
  const missingCols = EXPECTED_HEADERS.filter((h) => !headerRow.includes(h));
  if (missingCols.length > 0) {
    return { templates: [], errors: [`Missing required columns: ${missingCols.join(', ')}`] };
  }

  const col = (name: string) => headerRow.indexOf(name);
  const iProductName = col('product name');
  // Accept "material" (new) or the legacy "ingredients" header.
  const iMaterial = [col('material'), col('ingredients')].find((i) => i >= 0) ?? -1;
  // Accept "quantity" (new) or the legacy "weight" header.
  const iQuantity = [col('quantity'), col('weight')].find((i) => i >= 0) ?? -1;
  // Optional columns (070 BOM sections): Section (A/B/INGREDIENT/EXPONENTIAL) + Unit.
  const iSection = col('section');
  const iUnit = col('unit');

  // Group rows by Product Name
  const grouped = new Map<string, ParsedTemplate>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => !c?.trim())) continue; // blank row

    const productName = row[iProductName]?.trim() ?? '';
    const material = iMaterial >= 0 ? (row[iMaterial]?.trim() ?? '') : '';
    const quantity = iQuantity >= 0 ? (row[iQuantity]?.trim() ?? '') : '';
    const sectionToken = iSection >= 0 ? normalizeHeader(row[iSection] ?? '') : '';
    const sheetUnit = iUnit >= 0 ? (row[iUnit]?.trim() ?? '') : '';

    if (!productName) {
      errors.push(`Row ${i + 1}: missing Product Name — skipped`);
      continue;
    }
    if (!material) {
      errors.push(`Row ${i + 1}: missing Material — skipped`);
      continue;
    }
    const section = SECTION_TOKENS[sectionToken];
    if (section === undefined) {
      errors.push(`Row ${i + 1}: unknown Section "${row[iSection]}" (use A, B, INGREDIENT or EXPONENTIAL) — skipped`);
      continue;
    }

    if (!grouped.has(productName)) {
      grouped.set(productName, { name: productName, lines: [] });
    }
    grouped.get(productName)!.lines.push({ material, quantity, section, sheetUnit });
  }

  return { templates: Array.from(grouped.values()), errors };
}

export function BomImportDrawer({ open, onClose, onSuccess }: BomImportDrawerProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ParsedTemplate[]>([]);

  // The same catalog the Add/Edit Template drawer offers in its dropdowns —
  // imported values must match these or they aren't imported.
  const { products, isLoading: productsLoading } = useProducts();
  const { materials, isLoading: materialsLoading } = useRawMaterials();
  const refsLoading = productsLoading || materialsLoading;

  const productByKey = useMemo(() => {
    const m = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      m.set(p.name.trim().toLowerCase(), p);
      if (p.code) m.set(p.code.trim().toLowerCase(), p);
    }
    return m;
  }, [products]);

  const materialByKey = useMemo(() => {
    const m = new Map<string, (typeof materials)[number]>();
    for (const mat of materials) {
      m.set(mat.name.trim().toLowerCase(), mat);
      if (mat.code) m.set(mat.code.trim().toLowerCase(), mat);
    }
    return m;
  }, [materials]);

  const validated = useMemo<ValidatedTemplate[]>(
    () =>
      templates.map((t) => {
        const product = productByKey.get(t.name.trim().toLowerCase()) ?? null;
        const lines: ValidatedLine[] = t.lines.map((l) => {
          // Ingredient sections are free text — never matched against stock.
          if (INGREDIENT_SECTIONS.includes(l.section)) {
            return { ...l, rawMaterialId: null, unit: l.sheetUnit ? normalizeUom(l.sheetUnit) : '' };
          }
          const mat = materialByKey.get(l.material.trim().toLowerCase()) ?? null;
          return { ...l, rawMaterialId: mat?.id ?? null, unit: mat?.unit ?? '' };
        });
        const issues: string[] = [];
        if (!product) issues.push(`product "${t.name}" is not in Products`);
        const missing = [
          ...new Set(
            lines
              .filter((l) => !INGREDIENT_SECTIONS.includes(l.section) && l.rawMaterialId == null)
              .map((l) => l.material),
          ),
        ];
        if (missing.length) issues.push(`raw material not found: ${missing.join(', ')}`);
        return { name: t.name, productId: product?.id ?? null, lines, issues, valid: issues.length === 0 };
      }),
    [templates, productByKey, materialByKey],
  );

  // While the catalog is still loading, don't render scary "not found" results.
  const ready = !refsLoading;
  const validTemplates = ready ? validated.filter((t) => t.valid) : [];
  const invalidTemplates = ready ? validated.filter((t) => !t.valid) : [];

  const importMutation = useAdminImportBomsCsv({
    mutation: {
      onSuccess: (resp) => {
        const data = (resp as { data: { created: number; skipped: number; errors: string[] } }).data;
        // The backend imports unique rows and SKIPS existing ones, recording each
        // skip as a benign "… already exists" note in `errors`. Those skips are
        // expected — only genuine failures (everything else) should block the
        // drawer from closing.
        const genuineErrors = data.errors.filter((e) => !/already exists/i.test(e));
        const failed = genuineErrors.length;

        const msgs: string[] = [];
        if (data.created) msgs.push(`${data.created} template(s) imported.`);
        if (data.skipped) msgs.push(`${data.skipped} skipped (already exist).`);
        if (failed) msgs.push(`${failed} failed.`);
        const message = msgs.length ? msgs.join(' ') : 'Nothing to import.';
        toast({ severity: failed ? 'warning' : data.created ? 'success' : 'info', message });

        // Per-row commits already landed, so always refresh the list.
        onSuccess();
        if (failed) {
          // Real failures — keep the drawer open so the user can review and retry.
          setParseError(genuineErrors.slice(0, 5).join('\n'));
        } else {
          handleClose();
        }
      },
      onError: (err) => toast({ severity: 'error', message: errorMessage(err) }),
    },
  });

  const handleClose = () => {
    setTemplates([]);
    setParseError(null);
    setParseWarnings([]);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleFile = (file: File) => {
    setParseError(null);
    setParseWarnings([]);
    setTemplates([]);

    const ext = file.name.split('.').pop()?.toLowerCase();

    const processRows = (rows: string[][]) => {
      const { templates: parsed, errors } = parseRows(rows);
      if (parsed.length === 0) {
        setParseError(errors[0] ?? 'No valid rows found. Check the CSV format using the sample.');
        return;
      }
      setTemplates(parsed);
      if (errors.length) setParseWarnings(errors.slice(0, 5));
    };

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
          processRows(rows);
        } catch {
          setParseError('Failed to parse Excel file. Please use the sample CSV format.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse<string[]>(file, {
        complete: (result) => processRows(result.data as string[][]),
        error: () => setParseError('Failed to parse CSV. Please use the sample CSV format.'),
        skipEmptyLines: false,
      });
    }
  };

  const handleImport = () => {
    if (!validTemplates.length) return;
    const payload = validTemplates.map((t) => ({
      name: t.name,
      product_id: t.productId,
      output_qty: undefined,
      // Code is omitted → the backend auto-generates a unique IMP-NNNN.
      lines: t.lines.map((l) => ({
        section: l.section,
        raw_material_id: l.rawMaterialId,
        ingredient_name: l.material,
        quantity: l.quantity || undefined,
        // Materials: unit from the matched RM; ingredients: from the sheet.
        unit: l.unit || undefined,
      })),
    }));
    importMutation.mutate({ data: { templates: payload } });
  };

  return (
    <CustomDrawer
      anchor="right"
      title="Import BOM Templates"
      open={open}
      onClose={handleClose}
      drawerWidth="52rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        {/* Scrollable body; the action bar below stays pinned. */}
        <div className="flex flex-1 flex-col gap-6 px-6 py-5">
          {/* Sample download */}
        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="mb-1 text-sm font-medium text-foreground">Download sample file</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Columns: <span className="font-mono">Product Name, Material, Quantity, Section, Unit</span>.
            <strong> Section</strong> (optional): <span className="font-mono">A</span> = scales with batch size (default),{' '}
            <span className="font-mono">B</span> = fixed quantity, <span className="font-mono">INGREDIENT</span> /{' '}
            <span className="font-mono">EXPONENTIAL</span> = not-in-stock ingredient (fixed / scaled — give it a Unit).
            <strong> Product Name</strong> must match a Product; A/B materials must match a Raw Material.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  '/api/v1/admin/masters/boms/sample-csv',
                  undefined,
                  'bom-template-sample.csv',
                ).catch(() => toast({ severity: 'error', message: 'Failed to download sample CSV.' }))
              }
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
            >
              <Download className="size-4" /> Sample CSV
            </button>
          </div>
        </div>

        {/* File upload */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Upload CSV or Excel file</p>
          <label
            htmlFor="bom-import-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/10 p-8 text-center transition-colors hover:bg-muted/20"
          >
            <FileUp className="size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to select or drag a <strong>.csv</strong> or <strong>.xlsx</strong> file
            </span>
            <input
              id="bom-import-file"
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

        {/* Parse error */}
        {parseError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-line">
            {parseError}
          </div>
        )}

        {/* Row warnings (format / blank rows) */}
        {parseWarnings.length > 0 && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 whitespace-pre-line">
            {parseWarnings.join('\n')}
          </div>
        )}

        {/* Validation: rows that won't import because the product / material is unknown */}
        {templates.length > 0 && !ready && (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            Checking products and raw materials…
          </div>
        )}
        {invalidTemplates.length > 0 && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-medium">
              {invalidTemplates.length} product(s) won’t be imported — values not found in Products / Raw Materials:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {invalidTemplates.map((t) => (
                <li key={t.name}>
                  <span className="font-medium">{t.name}</span> — {t.issues.join('; ')}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Only products and raw materials that already exist (the same ones offered in the Add-Template dropdowns) can be imported.
            </p>
          </div>
        )}

        {/* Preview */}
        {templates.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">
              Preview — {validTemplates.length} of {validated.length} product(s) will import
              {invalidTemplates.length > 0 && (
                <span className="text-destructive"> · {invalidTemplates.length} skipped</span>
              )}
            </p>
            <div className="max-h-72 overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1 text-left">Product Name</th>
                    <th className="px-2 py-1 text-left">Material</th>
                    <th className="px-2 py-1 text-right">Quantity</th>
                    <th className="px-2 py-1 text-left">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.flatMap((tmpl) =>
                    tmpl.lines.map((line, lineIdx) => {
                      const productMissing = ready && lineIdx === 0 && tmpl.productId == null;
                      const materialMissing = ready && line.rawMaterialId == null && !INGREDIENT_SECTIONS.includes(line.section);
                      return (
                        <tr
                          key={`${tmpl.name}-${lineIdx}`}
                          className={cn('border-t border-border/40', ready && !tmpl.valid ? 'bg-destructive/5' : 'even:bg-muted/10')}
                        >
                          <td className={cn('px-2 py-0.5 font-medium', productMissing && 'text-destructive')}>
                            {lineIdx === 0 ? tmpl.name : ''}
                            {productMissing && <span className="ml-1 text-[10px]">(not found)</span>}
                          </td>
                          <td className={cn('px-2 py-0.5', materialMissing && 'text-destructive')}>
                            {line.material}
                            {materialMissing && <span className="ml-1 text-[10px]">(not found)</span>}
                          </td>
                          <td className="px-2 py-0.5 text-right">{fmtPreviewQty(line.quantity)}</td>
                          <td className="px-2 py-0.5 text-muted-foreground">{line.unit || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        </div>

        {/* Actions — pinned at the bottom while the body scrolls. */}
        <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton
            type="button"
            variant="primary"
            onClick={handleImport}
            disabled={!validTemplates.length}
            loading={importMutation.isPending}
          >
            {validTemplates.length ? `Import ${validTemplates.length}` : 'Import'}
          </CustomButton>
        </div>
      </div>
    </CustomDrawer>
  );
}
