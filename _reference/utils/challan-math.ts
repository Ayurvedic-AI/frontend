/**
 * DC / invoice bill math (meeting 2 §9 — Amruta madam's print format):
 *
 *   Gross      = Σ line amounts (qty × rate × (1 − disc%))
 *   CGST=SGST  = (Gross + Courier) × gst% / 2, paise-rounded
 *   Net Amount = Gross + Courier + CGST + SGST, rounded to the rupee
 *   Round Up   = Net − raw sum (the ± paise the print shows)
 *
 * One implementation shared by the dispatch-step preview and the DC print so
 * the two can never disagree. Mirrors the backend (sales_order_service).
 */

export interface ChallanTotals {
  gross: number;
  courier: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  net: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeChallanTotals(opts: {
  gross: number;
  courierCharges: number;
  gstPercent: number;
}): ChallanTotals {
  const gross = r2(opts.gross);
  const courier = r2(opts.courierCharges);
  const half = r2(((gross + courier) * opts.gstPercent) / 200);
  const raw = gross + courier + half + half;
  const net = Math.round(raw);
  return { gross, courier, cgst: half, sgst: half, roundOff: r2(net - raw), net };
}
