import { ArrowDownCircle, ArrowUpCircle, Eye, EyeOff, Search } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { formatIndianPhoneInput, normalizeIndianPhone } from '../../utils/phone';

export interface CustomInputProps {
  placeholder: string;
  name: string;
  value: string | number | undefined;
  isNumeric?: boolean;
  isDecimal?: boolean;
  hasError?: boolean;
  errorMessage?: string | undefined;
  isPassword?: boolean;
  isEmail?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disableField?: boolean;
  bgWhite?: boolean;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  hasStartSearchIcon?: boolean;
  startSearchIconOnRight?: boolean;
  onClickNotify?: () => void;
  hasOpenListArrow?: boolean;
  required?: boolean;
  maxValue?: number;
  icon?: ReactNode;
  phone?: boolean;
  zipCode?: boolean;
  ssn?: boolean;
  InputProps?: {
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;
  };
  autoComplete?: string;
  className?: string;
  id?: string;
}

// ── Formatting helpers ──────────────────────────────────────────────────────
// Phone uses the shared Indian formatter (src/utils/phone). SSN/zip remain
// US-format helpers (out of scope for feature 041).

function formatSSN(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
}

function formatZipCode(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
}

export const CustomInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, CustomInputProps>(
  function CustomInput(props, ref) {
    const {
      placeholder,
      name,
      value,
      isNumeric,
      isDecimal,
      hasError,
      errorMessage,
      isPassword,
      isEmail,
      onChange,
      disableField,
      bgWhite,
      maxLength,
      multiline,
      rows,
      hasStartSearchIcon,
      startSearchIconOnRight,
      onClickNotify,
      hasOpenListArrow,
      required,
      maxValue,
      icon,
      phone,
      zipCode,
      ssn,
      InputProps,
      autoComplete,
      className,
      id: idProp,
    } = props;

    const autoId = useId();
    const id = idProp ?? autoId;
    const helperId = `${id}-helper`;

    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState<string | number>(value ?? '');
    const phoneDisplay = useRef('');
    const ssnDisplay = useRef('');

    useEffect(() => {
      if (phone) {
        const next = formatIndianPhoneInput(String(value ?? ''));
        if (phoneDisplay.current !== next) {
          phoneDisplay.current = next;
          setInputValue(next);
        }
      } else if (ssn) {
        const next = formatSSN(String(value ?? ''));
        if (ssnDisplay.current !== next) {
          ssnDisplay.current = next;
          setInputValue(next);
        }
      } else {
        setInputValue(value ?? '');
      }
    }, [value, phone, ssn]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      if (phone) {
        const cleaned = normalizeIndianPhone(raw);
        const formatted = formatIndianPhoneInput(raw);
        phoneDisplay.current = formatted;
        setInputValue(formatted);
        onChange({ ...e, target: { ...e.target, value: cleaned } });
        return;
      }
      if (ssn) {
        const cleaned = raw.replace(/\D/g, '').slice(0, 9);
        const formatted = formatSSN(cleaned);
        ssnDisplay.current = formatted;
        setInputValue(formatted);
        onChange({ ...e, target: { ...e.target, value: cleaned } });
        return;
      }
      if (isNumeric && maxValue !== undefined) {
        const n = parseInt(raw, 10);
        if (raw === '' || n <= maxValue) {
          setInputValue(raw);
          onChange({ ...e, target: { ...e.target, value: raw } });
          return;
        }
        return;
      }
      if (zipCode) {
        const cleaned = raw.replace(/\D/g, '').slice(0, 9);
        const formatted = formatZipCode(cleaned);
        setInputValue(formatted);
        onChange({ ...e, target: { ...e.target, value: formatted } });
        return;
      }
      // Filter here and force the DOM value to the cleaned result. Setting state
      // alone is not enough: when the cleaned value equals the current state
      // (e.g. typing a trailing letter that gets stripped) React doesn't
      // re-render, so the raw character would linger in a production build.
      // Writing e.target.value makes the display correct regardless of re-render.
      if (isNumeric) {
        const cleaned = raw.replace(/[^0-9]/g, '');
        e.target.value = cleaned;
        setInputValue(cleaned);
        onChange({ ...e, target: { ...e.target, value: cleaned } });
        return;
      }
      if (isDecimal) {
        let cleaned = raw.replace(/[^0-9.]/g, '');
        const dot = cleaned.indexOf('.');
        if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
        e.target.value = cleaned;
        setInputValue(cleaned);
        onChange({ ...e, target: { ...e.target, value: cleaned } });
        return;
      }
      setInputValue(raw);
      onChange({ ...e, target: { ...e.target, value: raw } });
    };

    const constrainOnInput = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (phone) {
        const formatted = formatIndianPhoneInput(el.value);
        el.value = formatted;
        phoneDisplay.current = formatted;
        setInputValue(formatted);
        return;
      }
      if (ssn) {
        const cleaned = el.value.replace(/\D/g, '').slice(0, 9);
        const formatted = formatSSN(cleaned);
        el.value = formatted;
        ssnDisplay.current = formatted;
        setInputValue(formatted);
        return;
      }
      if (isNumeric) {
        el.value = el.value.replace(/[^0-9]/g, '');
        return;
      }
      if (isDecimal) {
        el.value = el.value.replace(/[^0-9.]/g, '');
      }
    };

    const showStart = Boolean(
      InputProps?.startAdornment || icon || (hasStartSearchIcon && !startSearchIconOnRight),
    );
    const showEnd = Boolean(
      InputProps?.endAdornment ||
        isPassword ||
        hasOpenListArrow ||
        (hasStartSearchIcon && startSearchIconOnRight),
    );

    const fieldType = showPassword
      ? 'text'
      : isPassword
        ? 'password'
        : isEmail
          ? 'email'
          : 'text';

    const inputMode = phone
      ? 'tel'
      : ssn
        ? 'numeric'
        : isNumeric
          ? 'numeric'
          : isDecimal
            ? 'decimal'
            : 'text';

    const fieldClasses = cn(
      'block w-full bg-transparent text-foreground placeholder:text-muted-foreground',
      'focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-60',
      multiline ? 'resize-y py-2.5' : 'h-11', // ≥44 px on md+
      // Padding handled by the wrapper so adornments don't double-pad.
    );

    const wrapperClasses = cn(
      'flex items-center gap-2 rounded-md border px-3',
      'border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40',
      bgWhite ? 'bg-white' : 'bg-background',
      hasError && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/30',
      disableField && 'cursor-not-allowed bg-secondary/60 opacity-70',
      className,
    );

    return (
      <div data-slot="root" className="flex w-full flex-col">
        <div data-slot="control-wrapper" className={wrapperClasses}>
          {showStart && (
            <span data-slot="start-adornment" className="flex shrink-0 items-center text-muted-foreground">
              {InputProps?.startAdornment ?? icon ?? (
                <Search aria-hidden="true" className="size-4" />
              )}
            </span>
          )}

          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              name={name}
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => handleChange(e as unknown as ChangeEvent<HTMLInputElement>)}
              disabled={disableField}
              required={required}
              maxLength={maxLength}
              rows={rows}
              onInput={constrainOnInput}
              data-slot="control"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? helperId : undefined}
              className={fieldClasses}
              style={rows ? { minHeight: `${rows * 1.5}em` } : undefined}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              name={name}
              type={fieldType}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleChange}
              disabled={disableField}
              required={required}
              maxLength={phone ? 15 : ssn ? 11 : maxLength}
              inputMode={inputMode}
              autoComplete={autoComplete ?? 'new'}
              onInput={constrainOnInput}
              data-slot="control"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? helperId : undefined}
              className={fieldClasses}
            />
          )}

          {showEnd && (
            <span data-slot="end-adornment" className="flex shrink-0 items-center gap-1 text-muted-foreground">
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded p-1 hover:bg-secondary"
                >
                  {showPassword ? (
                    <Eye aria-hidden="true" className="size-4" />
                  ) : (
                    <EyeOff aria-hidden="true" className="size-4" />
                  )}
                </button>
              )}
              {hasOpenListArrow && (
                <button
                  type="button"
                  onClick={() => onClickNotify?.()}
                  className="rounded p-1 hover:bg-secondary"
                  aria-label="Toggle list"
                >
                  {showPassword ? (
                    <ArrowUpCircle aria-hidden="true" className="size-4" />
                  ) : (
                    <ArrowDownCircle aria-hidden="true" className="size-4" />
                  )}
                </button>
              )}
              {InputProps?.endAdornment && !isPassword && !hasOpenListArrow && (
                <span>{InputProps.endAdornment}</span>
              )}
              {hasStartSearchIcon && startSearchIconOnRight && !InputProps?.endAdornment && (
                <Search aria-hidden="true" className="size-4" />
              )}
            </span>
          )}
        </div>

        {hasError && errorMessage && (
          <p id={helperId} role="alert" data-slot="helper" className="mt-1 text-xs leading-tight text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

export default CustomInput;
