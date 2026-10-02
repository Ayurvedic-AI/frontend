import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';
import { countryCodes as defaultCountryCodes, type CountryCode } from './countries';

export interface CountryCodeAutocompleteProps {
  /** Selected dial code (e.g. "+1"). */
  value: string;
  onChange: (value: string) => void;
  /** Override the country dataset (defaults to the bundled minimal list). */
  countries?: CountryCode[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CountryCodeAutocomplete = ({
  value,
  onChange,
  countries = defaultCountryCodes,
  placeholder = 'Select',
  disabled,
  className,
}: CountryCodeAutocompleteProps) => {
  const [open, setOpen] = useState(false);

  // Deduplicate by dial code to match legacy behavior.
  const unique = useMemo(
    () => Array.from(new Map(countries.map((c) => [c.code, c])).values()),
    [countries],
  );
  const selected = unique.find((c) => c.code === value);

  return (
    <div className={cn('w-[125px]', className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={selected ? `${selected.name} ${selected.code}` : placeholder}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm',
              'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {selected ? (
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-base leading-none">{selected.flag}</span>
                <span>{selected.code}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown aria-hidden className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            className="z-50 w-64 overflow-hidden rounded-md border border-border bg-background shadow-lg"
          >
            <CommandPrimitive>
              <div className="border-b border-border p-2">
                <CommandPrimitive.Input
                  placeholder="Search country…"
                  className="w-full bg-transparent px-1 py-1 text-sm focus:outline-none"
                />
              </div>
              <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
                <CommandPrimitive.Empty className="px-3 py-2 text-sm text-muted-foreground">
                  No country found
                </CommandPrimitive.Empty>
                {unique.map((c) => (
                  <CommandPrimitive.Item
                    key={c.iso2}
                    value={`${c.name} ${c.code}`}
                    onSelect={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm data-[selected=true]:bg-secondary data-[selected=true]:outline-none"
                  >
                    <span aria-hidden className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted-foreground">{c.code}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};

export default CountryCodeAutocomplete;
export { CountryCodeAutocomplete };
