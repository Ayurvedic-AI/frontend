import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';
import { CustomCheckbox } from '../custom-checkbox';

export interface MultiSelectOption {
  key: string;
  value: string;
}

export interface CustomMultiSelectProps {
  options: MultiSelectOption[];
  /** Array of selected `key` values. */
  value: string[];
  /** Called with the next array of selected keys. */
  onChange: (selectedKeys: string[]) => void;
  bgWhite?: boolean;
  placeholder: string;
  /** Show a search input above the option list. */
  enableSearch?: boolean;
  fontSize?: string;
  disabled?: boolean;
  className?: string;
}

const CustomMultiSelect = ({
  options,
  value,
  onChange,
  bgWhite,
  placeholder,
  enableSearch,
  fontSize,
  disabled,
  className,
}: CustomMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return options;
    const q = searchTerm.toLowerCase();
    return options.filter((opt) => opt.value.toLowerCase().includes(q));
  }, [options, searchTerm]);

  const toggle = (key: string) => {
    const next = value.includes(key) ? value.filter((k) => k !== key) : [...value, key];
    onChange(next);
  };

  const selectedCount = value.length;
  const display =
    selectedCount === 0
      ? placeholder
      : selectedCount === 1
        ? options.find((o) => o.key === value[0])?.value ?? `${selectedCount} selected`
        : `${selectedCount} selected`;

  return (
    <div className={cn('w-full', className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            style={fontSize ? { fontSize } : undefined}
            className={cn(
              'flex h-11 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm',
              'border-input',
              'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
              'disabled:cursor-not-allowed disabled:opacity-60',
              bgWhite ? 'bg-white' : 'bg-background',
            )}
          >
            <span className={cn('truncate', selectedCount === 0 && 'text-muted-foreground')}>
              {display}
            </span>
            <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            className="z-50 max-h-72 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-background shadow-lg"
          >
            {enableSearch && (
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search aria-hidden className="size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            )}
            <ul className="max-h-60 overflow-y-auto p-1" role="listbox" aria-multiselectable="true">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
              ) : (
                filtered.map((opt) => {
                  const checked = value.includes(opt.key);
                  return (
                    <li
                      key={opt.key}
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(opt.key)}
                      className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-secondary"
                    >
                      <CustomCheckbox checked={checked} showText={false} />
                      <span className="truncate">{opt.value}</span>
                      {checked && <Check aria-hidden className="ml-auto size-4 text-primary" />}
                    </li>
                  );
                })
              )}
            </ul>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};

export default CustomMultiSelect;
export { CustomMultiSelect };
