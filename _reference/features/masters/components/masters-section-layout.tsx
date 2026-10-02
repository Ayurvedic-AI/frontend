/**
 * Shared layout template for every Masters section (feature 027, US4):
 * back-link + title + description, toolbar (record count, "Active only"
 * toggle, search, primary action), and the table slot. Mobile-first — the
 * toolbar stacks below `sm`.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { CustomSearch } from '../../../common/custom-search';
import { PermissionButton } from '../../auth/permissions';
import { cn } from '../../../lib/cn';

export interface MastersSectionLayoutProps {
  title: string;
  /** Optional: the layout no longer renders a description (kept for callers that still pass one). */
  // description?: string;
  /** Back-link target + label (defaults to the Masters home). */
  backTo?: string;
  backLabel?: string;
  /** Total (filtered) record count from the server. */
  count: number;
  searchPlaceholder: string;
  /** Initial search box value (kept in the URL by the page). */
  searchValue?: string;
  onSearch: (value: string) => void;
  addLabel: string;
  onAdd: () => void;
  /** "Active only" toggle state; omit `onActiveOnlyChange` to hide the toggle. */
  activeOnly?: boolean;
  onActiveOnlyChange?: (active: boolean) => void;
  /** Optional extra action buttons rendered beside the primary Add button. */
  extraActions?: ReactNode;
  /** Optional filter controls rendered in the toolbar row beside the search box. */
  searchRowExtras?: ReactNode;
  /**
   * Compact toolbar (default): hide the "N records" count and group the filters
   * (Active-only toggle + search) on the right. Pass `false` to show the record
   * count on the left with the toggle.
   */
  compactToolbar?: boolean;
  children: ReactNode;
}

export function MastersSectionLayout({
  title,
  // description,
  backTo = '/masters',
  backLabel = 'Masters',
  count,
  searchPlaceholder,
  searchValue,
  onSearch,
  addLabel,
  onAdd,
  activeOnly = false,
  onActiveOnlyChange,
  extraActions,
  searchRowExtras,
  compactToolbar = true,
  children,
}: MastersSectionLayoutProps) {
  const activeOnlyToggle = onActiveOnlyChange ? (
    <button
      type="button"
      role="switch"
      aria-checked={activeOnly}
      onClick={() => onActiveOnlyChange(!activeOnly)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm',
        activeOnly ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          activeOnly ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-background shadow transition-all',
            activeOnly ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </span>
      Active only
    </button>
  ) : null;
  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {backLabel}
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {/* <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> */}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <PermissionButton
            permission="masters.create"
            deniedTooltip="You don't have permission to add records"
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={onAdd}
          >
            {addLabel}
          </PermissionButton>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {!compactToolbar && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {count} {count === 1 ? 'record' : 'records'}
            </span>
          )}
          {!compactToolbar && activeOnlyToggle}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {compactToolbar && activeOnlyToggle}
          {searchRowExtras}
          <CustomSearch
            textData={{ placeholder: searchPlaceholder, btnTitle: 'Search' }}
            onSearch={onSearch}
            initialValue={searchValue}
            hasStartSearchIcon
            width="22rem"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">{children}</div>
    </div>
  );
}

export default MastersSectionLayout;
