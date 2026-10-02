/** Shared types for the centralized media-upload flow (feature 027). */

export interface MediaOwner {
  /** Backend owner-registry key, e.g. "vendor", "product". */
  ownerType: string;
  ownerId: number;
}

export type UploadPhase = 'idle' | 'requesting' | 'uploading' | 'confirming' | 'done' | 'error';

export interface UploadState {
  phase: UploadPhase;
  /** 0–100, meaningful while `phase === 'uploading'`. */
  progress: number;
  fileName: string | null;
  error: string | null;
}

/** Mirrors svm-be settings.media_allowed_content_types. */
export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

/** `accept` attribute fed to the file picker / dropzone. */
export const ACCEPT_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.webp,.zip,.xlsx';

/** Mirrors svm-be settings.media_max_upload_bytes (20 MB). */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const ALLOWED_TYPES_LABEL = 'PDF, PNG, JPG, WEBP, ZIP or XLSX';

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}

/** Pre-flight validation matching the backend's presign rules. */
export function validateFile(file: File): string | null {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return `This file type is not allowed. Upload ${ALLOWED_TYPES_LABEL}.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} upload limit.`;
  }
  if (file.size === 0) {
    return 'Empty files cannot be uploaded.';
  }
  return null;
}
