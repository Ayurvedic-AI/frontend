import { forwardRef, useCallback, useLayoutEffect, useRef, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface CustomTextAreaProps {
  placeholder: string;
  name: string;
  value: string | number | undefined;
  /** Minimum number of visible rows. */
  minRow: number;
  /** Maximum rows before the textarea starts to scroll internally. */
  maxRow?: number;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  defaultValue?: string;
  className?: string;
  /** Optional native textarea props passthrough (e.g. `rows`, `maxLength`). */
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'name' | 'value' | 'onChange' | 'onBlur' | 'disabled' | 'placeholder' | 'defaultValue'
  >;
}

/**
 * Auto-resizing textarea controlled within [minRow, maxRow]. Replaces the
 * legacy MUI TextareaAutosize.
 */
function useAutosize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  minRow: number,
  maxRow: number,
  value: unknown,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight || '20') || 20;
    const paddingY =
      parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
    const minHeight = lineHeight * minRow + paddingY;
    const maxHeight = lineHeight * maxRow + paddingY;

    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, minRow, maxRow, value]);
}

const CustomTextAreaImpl = forwardRef<HTMLTextAreaElement, CustomTextAreaProps>(
  function CustomTextArea(
    {
      placeholder,
      name,
      value,
      minRow,
      maxRow = 10,
      onChange,
      onBlur,
      isDisabled,
      hasError,
      errorMessage,
      defaultValue,
      className,
      textareaProps,
    },
    ref,
  ) {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    useAutosize(internalRef, minRow, maxRow, value);

    const helperId = `${name}-helper`;

    return (
      <div data-slot="root" className="flex w-full flex-col">
        <textarea
          {...textareaProps}
          ref={setRef}
          data-slot="control"
          name={name}
          placeholder={placeholder}
          value={value ?? ''}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? helperId : undefined}
          rows={minRow}
          draggable={false}
          className={cn(
            'block w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm leading-6 text-foreground',
            'placeholder:text-muted-foreground',
            'border-input focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-60',
            hasError && 'border-destructive focus:border-destructive focus:ring-destructive/30',
            className,
          )}
        />
        {hasError && errorMessage && (
          <p
            id={helperId}
            data-slot="helper"
            role="alert"
            className="mt-1 text-xs leading-tight text-destructive"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

export const CustomTextArea = CustomTextAreaImpl;
export default CustomTextArea;
