/* eslint-disable react-refresh/only-export-components */
// This module intentionally co-locates the `<Toaster />` component with the
// imperative `toast()` / `useToast()` / `dismissToast()` API. Splitting these
// across files for fast-refresh's sake would just create import churn.
import { useEffect } from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster, type ExternalToast } from 'sonner';

// ── Imperative API (preferred) ──────────────────────────────────────────────

export type SnackbarSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: React.ReactNode;
  severity?: SnackbarSeverity;
  /** Duration in ms; `Infinity` keeps it open until dismissed. Default: 4000. */
  duration?: number;
  /** Optional inline action button. */
  action?: { label: string; onClick: () => void };
  /** Idempotency key so repeated calls dedupe. */
  id?: string;
}

function emit(opts: ToastOptions): string {
  const { message, severity = 'info', duration = 4000, action, id } = opts;
  const sonnerOpts: ExternalToast = {
    duration: duration === Infinity ? Infinity : duration,
    id,
    action: action
      ? { label: action.label, onClick: () => action.onClick() }
      : undefined,
  };
  const fn =
    severity === 'success'
      ? sonnerToast.success
      : severity === 'error'
        ? sonnerToast.error
        : severity === 'warning'
          ? sonnerToast.warning
          : sonnerToast.info;
  const handle = fn(message as string, sonnerOpts);
  return typeof handle === 'string' ? handle : String(handle ?? '');
}

/** Imperative entry point. */
export function toast(options: ToastOptions): string {
  return emit(options);
}

/** Dismiss one toast (by `id`) or all toasts (omit `id`). */
export function dismissToast(id?: string): void {
  sonnerToast.dismiss(id);
}

/** Hook form for typed access inside React components. */
export function useToast() {
  return { toast: emit, dismiss: dismissToast };
}

/** Mount once at the app root (already wired in `src/main.tsx`). */
export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  className?: string;
}
export const Toaster = ({ position = 'top-right', className }: ToasterProps = {}) => (
  // On phones sonner spans the top edge; drop it below the 64px app header / drawer title bar.
  <SonnerToaster position={position} className={className} richColors closeButton mobileOffset={{ top: 72 }} />
);

// ── Legacy controlled component (deprecated shim, kept for one release) ─────

export interface SnackbarProps {
  message: string;
  status: 'success' | 'error';
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: ToasterProps['position'];
}

let warned = false;

/**
 * @deprecated Use the imperative `toast()` / `useToast()` API instead.
 * This controlled-component shim exists so existing call sites keep working
 * for one release while teams migrate. It forwards to `toast()` under the
 * hood and never returns its own DOM.
 */
const CommonSnackbar = ({
  message,
  status,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 10_000,
}: SnackbarProps) => {
  useEffect(() => {
    if (!warned) {
      console.warn(
        '[school-erp] <CommonSnackbar /> is deprecated. Use `toast()` / `useToast()` from "@/common/common-snackbar" and mount <Toaster /> once at the app root.',
      );
      warned = true;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = `legacy-snackbar-${status}-${message}`;
    emit({
      message,
      severity: status,
      duration: autoClose ? autoCloseDelay : Infinity,
      id,
    });
    if (autoClose) {
      const t = setTimeout(() => onClose(), autoCloseDelay);
      return () => clearTimeout(t);
    }
  }, [isOpen, message, status, autoClose, autoCloseDelay, onClose]);

  return null;
};

export default CommonSnackbar;
export { CommonSnackbar };
