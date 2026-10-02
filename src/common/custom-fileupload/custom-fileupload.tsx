import { Paperclip, CloudUpload, File as FileIcon, Trash2, Upload } from 'lucide-react';
import { useCallback, type CSSProperties, type ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn';

export type FileUploadType = 'default' | 'drag-drop' | 'button' | 'icon';
export type FileUploadSize = 'sm' | 'md' | 'lg';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress?: number;
  error?: string;
}

export interface CustomFileUploadProps {
  files?: FileItem[];
  onFilesChange?: (files: FileItem[]) => void;
  onFileAdd?: (file: FileItem) => void;
  onFileRemove?: (fileId: string) => void;
  /** Fires for files the dropzone's `accept` filter rejects — without this they are dropped silently. */
  onFileRejected?: (file: File) => void;
  type?: FileUploadType;
  size?: FileUploadSize;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number; // bytes
  hasError?: boolean;
  errorMessage?: string;
  helperText?: string;
  placeholder?: string;
  buttonText?: string;
  className?: string;
  sx?: CSSProperties;
  showFileList?: boolean;
  showProgress?: boolean;
  allowDragDrop?: boolean;
  icon?: ReactNode;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').some((spec) => {
    const t = spec.trim();
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t.toLowerCase());
    return Boolean(file.type.match(t.replace('*', '.*')));
  });
}

export default function CustomFileUpload({
  files = [],
  onFilesChange,
  onFileAdd,
  onFileRemove,
  onFileRejected,
  type = 'default',
  size = 'md',
  disabled = false,
  multiple = false,
  accept,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024,
  hasError = false,
  errorMessage,
  helperText,
  placeholder = 'Click to upload or drag and drop files here',
  buttonText = 'Choose Files',
  className,
  sx,
  showFileList = true,
  allowDragDrop = true,
  icon,
}: CustomFileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[], rejections: { file: File }[] = []) => {
      if (disabled) return;
      rejections.forEach((rejection) => onFileRejected?.(rejection.file));
      if (files.length + accepted.length > maxFiles) return;
      const next: FileItem[] = accepted.map((f) => {
        let error: string | undefined;
        if (f.size > maxFileSize) error = `File size must be less than ${formatFileSize(maxFileSize)}`;
        else if (accept && !matchesAccept(f, accept)) error = 'File type not allowed';
        return {
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          progress: error ? undefined : 0,
          error,
        };
      });
      const updated = [...files, ...next];
      onFilesChange?.(updated);
      next.forEach((item) => {
        if (!item.error) onFileAdd?.(item);
      });
    },
    [files, disabled, maxFiles, maxFileSize, accept, onFilesChange, onFileAdd, onFileRejected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled,
    noDrag: !allowDragDrop,
    accept: accept ? { 'application/octet-stream': accept.split(',').map((s) => s.trim()) } : undefined,
  });

  const remove = (id: string) => {
    if (disabled) return;
    onFilesChange?.(files.filter((f) => f.id !== id));
    onFileRemove?.(id);
  };

  const dropzoneClasses = cn(
    'group flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background text-sm text-foreground transition-colors',
    'hover:border-ring hover:bg-secondary/30',
    isDragActive && 'border-ring bg-secondary/40',
    hasError && 'border-destructive',
    disabled && 'cursor-not-allowed opacity-60',
    size === 'sm' && 'p-3',
    size === 'md' && 'p-6',
    size === 'lg' && 'p-10',
  );

  const renderArea = () => {
    if (type === 'button') {
      return (
        <button
          type="button"
          disabled={disabled}
          {...getRootProps({ className: cn('inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60', className) })}
        >
          <input {...getInputProps()} />
          {icon ?? <Upload aria-hidden className="size-4" />}
          {buttonText}
        </button>
      );
    }
    if (type === 'icon') {
      return (
        <div {...getRootProps({ className: cn('inline-flex size-11 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60', className) })}>
          <input {...getInputProps()} />
          {icon ?? <Paperclip aria-hidden className="size-5" />}
        </div>
      );
    }
    if (size === 'sm' && (type === 'default' || type === 'drag-drop')) {
      return (
        <div {...getRootProps({ className: cn(dropzoneClasses, 'flex-row gap-2 text-primary'), style: sx })}>
          <input {...getInputProps()} />
          {icon ?? <CloudUpload aria-hidden className="size-4" />}
          <span className="font-medium">{placeholder || 'Upload'}</span>
        </div>
      );
    }
    return (
      <div {...getRootProps({ className: cn(dropzoneClasses, className), style: sx })}>
        <input {...getInputProps()} />
        <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          {icon ?? <CloudUpload aria-hidden className="size-7" />}
        </span>
        <p className="text-center">
          <span className="font-medium text-primary">Click to upload</span>
          <span className="text-muted-foreground"> or drag and drop</span>
        </p>
        {!helperText && (
          <p className="mt-1 text-xs text-muted-foreground">
            {(accept ? accept.replace(/\./g, '').toUpperCase() : 'SVG, PNG, JPG or GIF')} (max {formatFileSize(maxFileSize)})
          </p>
        )}
        {helperText && <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {renderArea()}

      {showFileList && files.length > 0 && (
        <ul className="flex flex-col gap-2" data-slot="file-list">
          {files.map((f) => (
            <li
              key={f.id}
              className={cn(
                'flex items-center gap-3 rounded-md border border-border bg-background p-2 text-sm',
                f.error && 'border-destructive',
              )}
            >
              <FileIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate" title={f.name}>{f.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
              {f.error && <span className="text-xs text-destructive">{f.error}</span>}
              <button
                type="button"
                onClick={() => remove(f.id)}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasError && errorMessage && (
        <p role="alert" className="text-xs leading-tight text-destructive">{errorMessage}</p>
      )}
      {!hasError && helperText && type !== 'default' && type !== 'drag-drop' && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export { CustomFileUpload };
