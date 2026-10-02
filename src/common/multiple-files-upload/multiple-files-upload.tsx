import { File as FileIcon, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn';

export interface FilesMetaData {
  name: string;
  type: string;
  preview: string;
  file: File;
}

export interface MultipleFilesUploadProps {
  onUpload: (filesMetaData: FilesMetaData[]) => void;
  /** Accepted MIME types or extensions. Defaults to PDF, PNG, JPEG, CSV. */
  accept?: string;
  /** Max file size in bytes per file. */
  maxSizeBytesPerFile?: number;
  /** Optional cap on the number of files. */
  maxFiles?: number;
  /** Preview style for the file list. */
  preview?: 'image-grid' | 'name-list';
  className?: string;
}

const DEFAULT_ACCEPT = '.pdf,.png,.jpeg,.jpg,.csv';

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').some((spec) => {
    const t = spec.trim();
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t.toLowerCase());
    return Boolean(file.type.match(t.replace('*', '.*')));
  });
}

const MultipleFilesUpload = ({
  onUpload,
  accept = DEFAULT_ACCEPT,
  maxSizeBytesPerFile,
  maxFiles,
  preview = 'name-list',
  className,
}: MultipleFilesUploadProps) => {
  const [uploaded, setUploaded] = useState<FilesMetaData[]>([]);

  const onDrop = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => {
        if (!matchesAccept(f, accept)) return false;
        if (maxSizeBytesPerFile && f.size > maxSizeBytesPerFile) return false;
        return true;
      });
      setUploaded((prev) => {
        const next = [...prev, ...valid.map((file) => ({ name: file.name, type: file.type, preview: URL.createObjectURL(file), file }))];
        return maxFiles ? next.slice(0, maxFiles) : next;
      });
    },
    [accept, maxSizeBytesPerFile, maxFiles],
  );

  useEffect(() => {
    onUpload(uploaded);
  }, [uploaded, onUpload]);

  const handleDelete = (idx: number) => {
    setUploaded((prev) => {
      const removed = prev[idx];
      if (removed?.preview?.startsWith('blob:')) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div
        {...getRootProps({
          className: cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input bg-background p-10 text-center transition-colors',
            'hover:border-ring hover:bg-secondary/30',
            isDragActive && 'border-ring bg-secondary/40',
          ),
        })}
      >
        <input {...getInputProps()} />
        <Upload aria-hidden className="size-10 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm font-medium">Drop the files here…</p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Drag &amp; drop files</p>
            <p className="text-sm text-muted-foreground">or</p>
            <p className="text-sm font-medium text-primary">Browse Files</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Supported formats: {accept}</p>

      {uploaded.length > 0 && (
        <ul className={cn(preview === 'image-grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-2')} data-slot="file-list">
          {uploaded.map((item, idx) => (
            <li
              key={`${item.name}-${idx}`}
              className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-2 text-sm"
            >
              {item.type.includes('image') ? (
                <img src={item.preview} alt={`Preview of ${item.name}`} className="size-16 rounded object-cover" />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded bg-background">
                  <FileIcon aria-hidden className="size-6 text-muted-foreground" />
                </span>
              )}
              <span className="flex-1 truncate" title={item.name}>{item.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                aria-label={`Remove ${item.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-background"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MultipleFilesUpload;
export { MultipleFilesUpload };
