/**
 * Direct-print host — same mechanics as the sales-order DC direct print: the
 * document mounts INVISIBLY (only the print CSS in index.css `.dc-print` shows
 * it), the browser's print dialog opens immediately, and the host unmounts
 * when the dialog closes. No on-screen preview. All the simple documents
 * (statement, receipt, invoice, PO, batch record, picking slip) render inside
 * this shell so they share one behaviour.
 */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PrintPreviewProps {
  onClose: () => void;
  children: ReactNode;
}

export function PrintPreview({ onClose, children }: PrintPreviewProps) {
  useEffect(() => {
    window.addEventListener('afterprint', onClose);
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', onClose);
    };
  }, [onClose]);

  // PORTALLED TO <body> on purpose. Rendered in place, the document sits seven
  // levels deep inside the app shell — whose `min-h-screen` ancestors still
  // occupy layout when hidden by `visibility`, which pushed a BLANK trailing
  // page onto every print. As a direct child of <body> the whole app (`#root`)
  // can simply be removed from the printed page, so the sheet contains the
  // document and nothing else. See the `@media print` block in index.css.
  //
  // The width cap and padding below are SCREEN-preview styling only — on paper
  // the sheet is governed solely by `@page` (A4 + 10mm).
  return createPortal(
    <div className="dc-print-overlay invisible fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="dc-print bg-white p-6 text-black shadow-xl print:p-0 print:shadow-none">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Standard firm header used by the simple documents. */
export function PrintHeader({ title, refNo, refDate }: { title: string; refNo?: string; refDate?: string }) {
  return (
    <>
      <div className="border-b border-neutral-400 px-3 py-2 text-center">
        <p className="text-base font-bold uppercase">Ayurveda AI Clinic</p>
        <p className="text-sm font-semibold uppercase">{title}</p>
      </div>
      {(refNo || refDate) && (
        <div className="flex justify-between border-b border-neutral-400 px-3 py-1.5 text-sm">
          <span>{refNo ? <>No: <b>{refNo}</b></> : null}</span>
          <span>{refDate ? <>Date: <b>{refDate}</b></> : null}</span>
        </div>
      )}
    </>
  );
}

/** Signature strip shared by the documents. */
export function PrintSignatures({ left = 'Received by', right = 'Authorized signatory' }: { left?: string; right?: string }) {
  return (
    <div className="mt-10 flex justify-between px-3 pb-3 text-sm">
      <span className="border-t border-neutral-500 px-4 pt-1">{left}</span>
      <span className="border-t border-neutral-500 px-4 pt-1">{right}</span>
    </div>
  );
}
