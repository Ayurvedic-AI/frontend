import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { cn } from '../../lib/cn';

export interface AutocompleteOption {
  key: string;
  value: string;
  /** Optional fully-custom rendering for this item. */
  child?: ReactElement;
}

export interface CustomAutoCompleteProps {
  options: AutocompleteOption[];
  /** Selected key. */
  value?: string;
  loading?: boolean;
  loadingText?: string;
  onChange: (selectedKey: string) => void;
  onClick?: () => void;
  /** Called (debounced) with the current input value. */
  onDebounceCall?: (selectedValue: string) => void;
  /** Called when the user clears the input. */
  onInputEmpty?: () => void;
  width?: string;
  height?: string;
  hasError?: boolean;
  errorMessage?: string;
  placeholder?: string;
  isDisabled?: boolean;
  bgWhite?: boolean;
  hasStartSearchIcon?: boolean;
  /** Render the input value as empty even when an option is selected. */
  hideTextPreview?: boolean;
  /** Hide the dropdown caret. */
  hideArrow?: boolean;
  /** Debounce in ms before `onDebounceCall` fires. */
  debounceMs?: number;
  /**
   * Window long lists: render only the first N (filtered) options and reveal
   * N more each time the list is scrolled to the bottom. Typing re-filters
   * over the FULL option set and resets the window. Omit → render everything
   * (existing behaviour).
   */
  initialVisible?: number;
  /** Commit typed-but-unselected text as the value on close (instead of the
   *  default silent revert) so the form's schema can reject it with a visible
   *  message — used by the State fields (#216). */
  commitFreeText?: boolean;
  className?: string;
}

const CustomAutoComplete = ({
  options,
  value,
  loading,
  loadingText = 'Loading…',
  onChange,
  onClick,
  onDebounceCall,
  onInputEmpty,
  width,
  height,
  hasError,
  errorMessage,
  placeholder,
  isDisabled,
  bgWhite,
  hasStartSearchIcon,
  hideTextPreview,
  hideArrow,
  debounceMs = 1000,
  initialVisible,
  commitFreeText,
  className,
}: CustomAutoCompleteProps) => {
  const selected = options.find((opt) => opt.key === value);
  const [input, setInput] = useState(selected?.value ?? '');
  // The label of the currently-committed pick. Tracked separately from `selected`
  // because the visible `options` may be filtered (e.g. the line-item pickers
  // narrow by type) — which would drop `selected` and silently break smart-delete.
  // While this holds the committed label, one Backspace clears the whole pick.
  const [committedLabel, setCommittedLabel] = useState(selected?.value ?? '');
  const [open, setOpen] = useState(false);
  // Index of the keyboard-highlighted option (drives the cmdk highlight below).
  const [activeIndex, setActiveIndex] = useState(0);
  // The input doubles as the popover anchor. Radix treats the anchor as
  // "outside" the content, so the pointer-down that focuses the input (and opens
  // the list via onFocus) is then caught by the dismiss layer and closes it
  // immediately — the list only ever appeared if you typed. We keep a ref to the
  // anchor and veto any dismiss whose target lives inside it.
  const anchorRef = useRef<HTMLDivElement>(null);
  const isInsideAnchor = (target: EventTarget | null) =>
    target instanceof Node && !!anchorRef.current?.contains(target);

  // Keep input in sync when the parent changes `value` from the outside.
  // React's official "store information from previous renders" pattern:
  // compare a snapshot-state against the latest prop, and trigger a re-derive
  // when they diverge. https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    // In commitFreeText mode a value may be raw typed text with no matching
    // option — keep it visible instead of blanking the input.
    const next =
      options.find((o) => o.key === value)?.value ?? (commitFreeText && value ? value : '');
    if (next !== input) setInput(next);
    // Keep the committed label in lock-step with an externally-set value.
    setCommittedLabel(value ? next : '');
  }

  // Debounced callback. A committed selection's label is NOT a search query —
  // firing it would narrow a shared server-side search to the picked label
  // (which matches nothing) and blank sibling pickers' option lists.
  useEffect(() => {
    if (!onDebounceCall) return;
    if (input === committedLabel) return;
    const t = setTimeout(() => {
      if (input && (input.length > 3 || input === '')) onDebounceCall(input);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [input, committedLabel, onDebounceCall, debounceMs]);

  // Memoized filter result — must be unconditional (rules-of-hooks).
  const filteredOptions = useMemo(() => {
    const q = input.toLowerCase();
    return options.filter((o) => o.value.toLowerCase().includes(q));
  }, [options, input]);

  // Keep the highlight on the first match as the user types or (re)opens —
  // adjusting state during render (the repo's no-effect pattern), keyed on the
  // query + open-state so arrow-key moves don't get reset.
  // Windowed rendering (opt-in via `initialVisible`): how many filtered
  // options are shown; grown by the list's scroll handler. A new query or a
  // re-open resets the window to the first page.
  const [visibleCount, setVisibleCount] = useState(initialVisible ?? 0);

  const navKey = `${input} ${open}`;
  const [lastNavKey, setLastNavKey] = useState(navKey);
  if (lastNavKey !== navKey) {
    setLastNavKey(navKey);
    setActiveIndex(0);
    if (initialVisible != null && visibleCount !== initialVisible) setVisibleCount(initialVisible);
  }

  const visibleOptions =
    initialVisible != null ? filteredOptions.slice(0, visibleCount) : filteredOptions;
  const hiddenCount = filteredOptions.length - visibleOptions.length;

  const commit = (opt: AutocompleteOption) => {
    onChange(opt.key);
    setInput(opt.value);
    setCommittedLabel(opt.value);
    setOpen(false);
    // Restore the default (unsearched) option page — pickers sharing this
    // search (e.g. sales-order line rows) must not stay filtered by the text
    // that was typed to find this pick.
    onInputEmpty?.();
  };

  return (
    <div
      className={cn('flex w-full flex-col', className)}
      style={width ? { width } : undefined}
    >
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Standard combobox behaviour (#216): typed-but-never-committed text is
          // not a value — on close, snap the input back to the committed label so
          // the field never LOOKS filled while the form value is actually empty.
          if (!next && input !== committedLabel) {
            if (commitFreeText) {
              onChange(input);
              setCommittedLabel(input);
            } else {
              setInput(committedLabel);
            }
          }
        }}
      >
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={anchorRef}
            onClick={onClick}
            style={height ? { height } : undefined}
            className={cn(
              'flex h-11 w-full items-center gap-2 rounded-md border px-3',
              'border-input',
              'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40',
              bgWhite ? 'bg-white' : 'bg-background',
              hasError && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/30',
              isDisabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {hasStartSearchIcon && (
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
            <input
              type="text"
              placeholder={placeholder}
              value={hideTextPreview ? '' : input}
              disabled={isDisabled}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                // Smart delete: when the field shows a committed selection, one
                // Backspace clears the whole pick (instead of editing the label
                // character-by-character) and reopens the list for a fresh search.
                // Keyed off the tracked committed label so it works even when the
                // visible options are filtered (line-item pickers narrow by type).
                if (e.key === 'Backspace' && committedLabel && input === committedLabel) {
                  e.preventDefault();
                  onChange('');
                  setInput('');
                  setCommittedLabel('');
                  setOpen(true);
                  onInputEmpty?.();
                  return;
                }
                // Keyboard navigation. Crucially, Enter while the list is open
                // selects the highlighted option and is swallowed here, so it
                // never bubbles up to submit the host form/drawer.
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!open) setOpen(true);
                  else setActiveIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && open) {
                  e.preventDefault();
                  const pick = visibleOptions[Math.min(activeIndex, visibleOptions.length - 1)];
                  if (pick) commit(pick);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                  // Same as onOpenChange: commit or abandon the typed text.
                  if (input !== committedLabel) {
                    if (commitFreeText) {
                      onChange(input);
                      setCommittedLabel(input);
                    } else {
                      setInput(committedLabel);
                    }
                  }
                }
              }}
              onChange={(e) => {
                setInput(e.target.value);
                // The user is editing freehand — the field no longer shows a
                // committed pick, so a Backspace here edits character-by-character.
                setCommittedLabel('');
                setOpen(true);
                if (e.target.value === '') onInputEmpty?.();
              }}
              className="block w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            />
            {loading && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />}
            {!hideArrow && !loading && (
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
            )}
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => {
              if (isInsideAnchor(e.target)) e.preventDefault();
            }}
            onInteractOutside={(e) => {
              if (isInsideAnchor(e.target)) e.preventDefault();
            }}
            className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-background shadow-lg"
          >
            <CommandPrimitive
              shouldFilter={false}
              // Drive the visible highlight from our keyboard index; syncing back
              // on hover keeps mouse and keyboard selection in agreement.
              value={visibleOptions[activeIndex]?.key ?? ''}
              onValueChange={(v) => {
                const idx = visibleOptions.findIndex((o) => o.key === v);
                if (idx >= 0) setActiveIndex(idx);
              }}
            >
              <CommandPrimitive.List
                className="max-h-60 overflow-y-auto p-1"
                // The host drawer is a modal Radix Dialog, whose react-remove-scroll
                // lock blocks wheel events on this portaled popover (scrollbar shows
                // but won't move). Scroll the list manually so the wheel works.
                onWheel={(e) => {
                  e.currentTarget.scrollTop += e.deltaY;
                }}
                // Windowing: nearing the bottom reveals the next page of options.
                onScroll={(e) => {
                  if (initialVisible == null || hiddenCount <= 0) return;
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
                    setVisibleCount((c) => Math.min(c + initialVisible, filteredOptions.length));
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    {loadingText}
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                ) : (
                  <>
                    {visibleOptions.map((opt) => (
                      <CommandPrimitive.Item
                        key={opt.key}
                        // Identity must be unique per record. Using the display label
                        // makes cmdk treat same-labelled options (e.g. duplicate seed
                        // doctors) as one item and highlight them all together.
                        value={opt.key}
                        onSelect={() => commit(opt)}
                        className="cursor-pointer rounded px-3 py-1.5 text-sm data-[selected=true]:bg-secondary data-[selected=true]:outline-none"
                      >
                        {opt.child ?? opt.value}
                      </CommandPrimitive.Item>
                    ))}
                    {hiddenCount > 0 && (
                      <div className="px-3 py-1.5 text-center text-xs text-muted-foreground">
                        Showing {visibleOptions.length} of {filteredOptions.length} — scroll for
                        more, or type to search
                      </div>
                    )}
                  </>
                )}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {hasError && errorMessage && (
        <p role="alert" className="mt-1 text-xs leading-tight text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default CustomAutoComplete;
export { CustomAutoComplete };
