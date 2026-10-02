/**
 * Shared documents panel (feature 027): upload + list + download + delete for
 * one owning record. Every masters section renders this same component, so the
 * document experience is identical everywhere (US1 scenario 6).
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { CustomButton } from '../custom-buttons';
import { CustomFileUpload } from '../custom-fileupload';
import { ConfirmationPopUp } from '../confirmation-pop-up';
import { useToast } from '../common-snackbar';
import {
  adminDeleteMedia,
  adminGetMediaDownloadUrl,
  getAdminListMediaQueryKey,
  getAdminListMediaQueryOptions,
} from '../../sdk/media';
import type { DownloadUrlResponse, MediaItem, MediaListResponse } from '../../sdk/schemas';
import { errorMessage } from '../../utils/api-messages';
import { formatDate } from '../../utils/format';
import { useMediaUpload } from './use-media-upload';
import { ACCEPT_EXTENSIONS, ALLOWED_TYPES_LABEL, formatBytes, type MediaOwner } from './types';

export interface MediaDocumentsPanelProps {
  owner: MediaOwner;
  /** Notifies the host (e.g. to refresh a media_count badge) after add/remove. */
  onChanged?: () => void;
  /** View + download only — hides the upload dropzone and delete action. */
  readOnly?: boolean;
}

interface ListEnvelope {
  data: MediaListResponse;
  status: number;
}

export function MediaDocumentsPanel({ owner, onChanged, readOnly }: MediaDocumentsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const params = { owner_type: owner.ownerType, owner_id: owner.ownerId };
  const listQuery = useQuery(getAdminListMediaQueryOptions(params));
  const envelope = listQuery.data as ListEnvelope | undefined;
  const documents = envelope?.data.results ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getAdminListMediaQueryKey(params) });
    onChanged?.();
  };

  // Upload had no success feedback, unlike delete (#31). Toast then refresh —
  // kept separate from `refresh` so delete doesn't show a second toast.
  const handleUploaded = () => {
    toast({ severity: 'success', message: 'Document uploaded.' });
    refresh();
  };

  const { state, upload, reset } = useMediaUpload(owner, { onUploaded: handleUploaded });
  const busy = state.phase === 'requesting' || state.phase === 'uploading' || state.phase === 'confirming';

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await adminGetMediaDownloadUrl(String(item.uuid));
      const url = (response.data as DownloadUrlResponse).url;
      // Anchor click instead of window.open: popup blockers kill window.open
      // once the user gesture has been consumed by the awaited fetch above.
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.rel = 'noopener';
      anchor.download = item.file_name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      toast({ severity: 'error', message: errorMessage(error, 'Could not get a download link.') });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminDeleteMedia(String(pendingDelete.uuid));
      toast({ severity: 'success', message: 'Document deleted.' });
      setPendingDelete(null);
      refresh();
    } catch (error) {
      toast({ severity: 'error', message: errorMessage(error, 'Could not delete the document.') });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!readOnly && (
      <CustomFileUpload
        type="drag-drop"
        size="md"
        accept={ACCEPT_EXTENSIONS}
        disabled={busy}
        showFileList={false}
        helperText={`${ALLOWED_TYPES_LABEL} · up to ${formatBytes(20 * 1024 * 1024)}`}
        onFileAdd={(item) => {
          void upload(item.file);
        }}
        // Files the picker's accept filter rejects still get a visible error
        // (upload() fails pre-flight with the allowed-types message).
        onFileRejected={(file) => {
          void upload(file);
        }}
      />
      )}

      {busy && (
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate pr-2">{state.fileName}</span>
            <span>
              {state.phase === 'uploading' ? `${state.progress}%` : state.phase === 'confirming' ? 'Finishing…' : 'Preparing…'}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${state.phase === 'requesting' ? 5 : state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>
            <span className="font-medium">{state.fileName}</span>: {state.error}
          </span>
          <CustomButton type="button" variant="outline" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={reset}>
            Dismiss
          </CustomButton>
        </div>
      )}

      {listQuery.isPending ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Loading documents…</div>
      ) : listQuery.isError ? (
        <div className="py-6 text-center text-sm text-destructive">
          Could not load documents.{' '}
          <button type="button" className="underline" onClick={() => void listQuery.refetch()}>
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          {readOnly
            ? 'No documents on this record.'
            : 'No documents yet. Upload certificates, photos or sheets for this record.'}
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border">
          {documents.map((item) => (
            <li key={String(item.uuid)} className="flex items-center gap-3 px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(item.size_bytes)} · {formatDate(item.created_at)}
                  {item.uploaded_by_name ? ` · ${item.uploaded_by_name}` : ''}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Download ${item.file_name}`}
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => void handleDownload(item)}
              >
                <Download className="size-4" />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  aria-label={`Delete ${item.file_name}`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setPendingDelete(item)}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmationPopUp
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete document"
        message={
          pendingDelete ? (
            <>
              Delete <span className="font-medium">{pendingDelete.file_name}</span>? It will no longer be
              downloadable from this record.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        confirmDisabled={deleting}
      />
    </div>
  );
}

export default MediaDocumentsPanel;
