import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '../../../lib/cn';

interface OtpInputProps {
  value: string[];
  onChange: (otp: string[]) => void;
  length?: number;
  hasError?: boolean;
}

/**
 * Six bound `<input type="text" inputMode="numeric">` boxes with shared
 * a11y wiring + auto-advance on digit, backspace-to-previous, and
 * paste-to-fill behavior.
 */
export function OtpInput({ value, onChange, length = 6, hasError = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (digit && !/^\d$/.test(digit)) return;
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = [...value];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    onChange(next);
    const nextEmpty = next.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div
      className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3"
      data-slot="otp-input"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${index + 1}`}
          aria-invalid={hasError || undefined}
          className={cn(
            'size-10 rounded-md border bg-background text-center text-base font-semibold text-foreground sm:size-11 md:size-12 md:text-lg',
            'border-input focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
            hasError && 'border-destructive focus:border-destructive focus:ring-destructive/30',
          )}
        />
      ))}
    </div>
  );
}

export default OtpInput;
