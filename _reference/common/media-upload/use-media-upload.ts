/**
 * Centralized upload hook (feature 027): presign → browser-direct POST to the
 * bucket (with progress) → confirm. The backend never sees the file bytes.
 *
 * The S3 POST is a plain XHR (no credentials/cookies — the presigned policy IS
 * the authorization); progress comes from `xhr.upload.onprogress`.
 */
import { useCallback, useState } from 'react';
import { adminConfirmMediaUpload, adminCreateMediaUpload } from '../../sdk/media';
import type { MediaItem, PresignedUploadResponse } from '../../sdk/schemas';
import { errorMessage } from '../../utils/api-messages';
import type { MediaOwner, UploadState } from './types';
import { validateFile } from './types';

const IDLE: UploadState = { phase: 'idle', progress: 0, fileName: null, error: null };

function postToBucket(
  presigned: PresignedUploadResponse,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(presigned.fields)) {
      form.append(key, value);
    }
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', presigned.upload_url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      // S3 presigned POST answers 204 (or 201 with a success_action_status).
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage rejected the upload (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading — try again'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(form);
  });
}

export interface UseMediaUploadResult {
  state: UploadState;
  /** Validates, uploads and confirms. Resolves with the ready MediaItem, or null on failure. */
  upload: (file: File) => Promise<MediaItem | null>;
  reset: () => void;
}

export function useMediaUpload(
  owner: MediaOwner,
  options?: { onUploaded?: (item: MediaItem) => void },
): UseMediaUploadResult {
  const [state, setState] = useState<UploadState>(IDLE);

  const reset = useCallback(() => setState(IDLE), []);

  const upload = useCallback(
    async (file: File): Promise<MediaItem | null> => {
      const invalid = validateFile(file);
      if (invalid) {
        setState({ phase: 'error', progress: 0, fileName: file.name, error: invalid });
        return null;
      }
      setState({ phase: 'requesting', progress: 0, fileName: file.name, error: null });
      try {
        const presignEnvelope = await adminCreateMediaUpload({
          owner_type: owner.ownerType,
          owner_id: owner.ownerId,
          file_name: file.name,
          content_type: file.type,
          size_bytes: file.size,
        });
        const presigned = presignEnvelope.data as PresignedUploadResponse;

        setState({ phase: 'uploading', progress: 0, fileName: file.name, error: null });
        await postToBucket(presigned, file, (progress) =>
          setState({ phase: 'uploading', progress, fileName: file.name, error: null }),
        );

        setState({ phase: 'confirming', progress: 100, fileName: file.name, error: null });
        const confirmEnvelope = await adminConfirmMediaUpload(String(presigned.media_uuid));
        const item = confirmEnvelope.data as MediaItem;

        setState({ phase: 'done', progress: 100, fileName: file.name, error: null });
        options?.onUploaded?.(item);
        return item;
      } catch (error) {
        // XHR failures arrive as plain Errors with a useful message; API
        // failures carry the backend's `detail` via errorMessage.
        const message =
          error instanceof Error && error.message && !('status' in error)
            ? error.message
            : errorMessage(error);
        setState({ phase: 'error', progress: 0, fileName: file.name, error: message });
        return null;
      }
    },
    [owner.ownerType, owner.ownerId, options],
  );

  return { state, upload, reset };
}
