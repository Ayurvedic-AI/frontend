import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { CustomInput } from '../custom-input';
import { cn } from '../../lib/cn';

export interface SearchFilterProps {
  textData: {
    placeholder: string;
    /** Reserved for legacy compatibility. The migrated component does not render a separate search button. */
    btnTitle: string;
  };
  /** Fires (debounced) with the current input value. */
  onSearch?: (value: string) => void;
  /** Seed the input on mount (e.g. restoring a search term from the URL). */
  initialValue?: string;
  /** Wrapper width passthrough (Tailwind-friendly e.g. `"24rem"` or `"100%"`). */
  width?: string;
  /** Render a search icon on the left. */
  hasStartSearchIcon?: boolean;
  /** Move the search icon to the right side. */
  startSearchIconOnRight?: boolean;
  /** Debounce in ms before `onSearch` fires. */
  debounceMs?: number;
  /** Allow callers to clear the field; defaults to true. */
  clearable?: boolean;
  className?: string;
}

const SearchFilter = ({
  textData,
  onSearch,
  initialValue = '',
  width,
  hasStartSearchIcon,
  startSearchIconOnRight,
  debounceMs = 300,
  className,
}: SearchFilterProps) => {
  const [inputValue, setInputValue] = useState(initialValue);

  // Hold the latest onSearch in a ref so it is NOT an effect dependency.
  // Callers often pass an inline handler (new identity every render); if that
  // were a dependency, any unrelated parent re-render (e.g. paging) would
  // re-run the debounce and fire a spurious search, resetting parent state.
  const onSearchRef = useRef(onSearch);
  // Keep the ref pointing at the latest handler without making it an effect
  // dependency (assigning in an effect, not during render).
  useEffect(() => {
    onSearchRef.current = onSearch;
  });
  // Skip the initial mount so we don't emit an empty search on first render.
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const t = setTimeout(() => onSearchRef.current?.(inputValue), debounceMs);
    return () => clearTimeout(t);
  }, [inputValue, debounceMs]);

  return (
    <div className={cn('flex items-center', className)} style={width ? { width } : undefined}>
      <CustomInput
        name="search"
        placeholder={textData.placeholder}
        value={inputValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        bgWhite
        hasStartSearchIcon={hasStartSearchIcon}
        startSearchIconOnRight={startSearchIconOnRight}
        className={width ? undefined : 'w-52'}
      />
    </div>
  );
};

export default SearchFilter;
export { SearchFilter as CustomSearch };
