import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { UserAvatar } from '../../../common/user-avatar';
import { listClientsOptions } from '../../clients/api/clients-stubs';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { GlobalSearchSkeleton } from './GlobalSearchSkeleton';
import { NAVBAR_HEIGHT } from '../constants';

export const GlobalSearch = memo(function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isExpanded,
    searchTerm,
    debouncedTerm,
    isQueryEnabled,
    showDropdown,
    expand,
    collapse,
    handleSearchChange,
  } = useGlobalSearch();

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) inputRef.current.focus();
  }, [isExpanded]);

  // Escape to collapse + click-outside collapse.
  useEffect(() => {
    if (!isExpanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') collapse();
    };
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) collapse();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isExpanded, collapse]);

  const { data, isLoading, isError } = useQuery({
    ...listClientsOptions({ query: { search: debouncedTerm, page_size: 5 } }),
    enabled: isQueryEnabled,
  });

  const results = data?.results ?? [];
  const isSearchPending = isLoading || (searchTerm !== debouncedTerm && searchTerm.length >= 1);

  const handleResultClick = (uuid: string) => {
    collapse();
    navigate(`/clients/${uuid}`);
  };

  const handleViewAll = () => {
    const term = searchTerm;
    collapse();
    navigate(`/clients?search=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className="relative flex items-center" data-slot="global-search">
      {/* Collapsed trigger */}
      {!isExpanded && (
        <button
          type="button"
          onClick={expand}
          aria-label="Search clients"
          className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search aria-hidden className="size-5" />
        </button>
      )}

      {/* Expanded input */}
      {isExpanded && (
        <div
          className={cn(
            'flex items-center gap-2',
            // Mobile (xs): fixed full-navbar overlay; sm+: inline pill.
            'fixed inset-x-0 top-0 z-50 h-[var(--mhg-nav-h)] bg-white px-3 sm:static sm:h-auto sm:w-60 md:w-64 lg:w-72',
            'sm:rounded-md sm:border sm:border-border sm:bg-background sm:px-3 sm:py-2',
          )}
          style={{ ['--mhg-nav-h' as never]: `${NAVBAR_HEIGHT}px` } as React.CSSProperties}
        >
          <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search clients..."
            role="combobox"
            aria-label="Search clients"
            aria-expanded={showDropdown}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={collapse}
            aria-label="Close search"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
      )}

      {/* Results dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          className={cn(
            'absolute right-0 top-full mt-2 max-h-[420px] w-80 overflow-y-auto rounded-lg border border-border bg-background shadow-xl',
            'sm:right-0 md:w-[340px]',
            // Mobile full-width overlay.
            'max-sm:fixed max-sm:inset-x-0 max-sm:top-[var(--mhg-nav-h,64px)] max-sm:mt-0 max-sm:w-screen max-sm:rounded-none max-sm:max-h-[calc(100vh-var(--mhg-nav-h,64px))]',
          )}
        >
          {isSearchPending ? (
            <GlobalSearchSkeleton />
          ) : isError ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Something went wrong</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No clients found</p>
          ) : (
            <div>
              {results.map((client) => (
                <button
                  key={client.uuid}
                  type="button"
                  role="option"
                  onClick={() => handleResultClick(client.uuid)}
                  aria-selected={false}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-secondary"
                >
                  <UserAvatar
                    firstName={client.first_name}
                    lastName={client.last_name}
                    size={32}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      MRN: {client.mrn ?? '—'}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={handleViewAll}
                className="block w-full border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-secondary"
              >
                View all results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
