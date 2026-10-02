import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsQueryOptions, type LeadList } from '../../crm/api/crm';
import { salesOrdersQueryOptions } from '../../sales-orders/api/sales-orders';
import {
  getAdminListDoctorsQueryOptions,
  getAdminListProductsQueryOptions,
} from '../../../sdk/inventory';
import { getAdminListPurchaseOrdersQueryOptions } from '../../../sdk/purchasing';
import type {
  DoctorListResponse,
  ProductListResponse,
  PurchaseOrderList,
  SalesOrderList,
} from '../../../sdk/schemas';
import { usePermissions } from '../../auth/permissions';

/**
 * Global header search (UX research P4 — ERPNext Awesomebar / Zoho Zia
 * pattern, scoped to RECORD SEARCH + NAVIGATION per the small-surface caveat).
 * One box finds orders, doctors, products, purchase orders and leads; each
 * group's query fires only when the role can view that module. Ctrl/Cmd+K
 * focuses the box. 300ms debounce; a few rows per group (≤10 visible total).
 */

interface Hit {
  key: string;
  title: string;
  subtitle?: string;
  to: string;
}

interface Group {
  label: string;
  hits: Hit[];
}

function unwrap<T>(x: unknown): T | undefined {
  return (x as { data?: T } | undefined)?.data;
}

const PER_GROUP = 3;

export const HeaderSearch = memo(function HeaderSearch() {
  const navigate = useNavigate();
  const perms = usePermissions();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  // Ctrl/Cmd+K focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const q = debounced.trim();
  const active = q.length >= 2;

  const ordersQ = useQuery({
    ...salesOrdersQueryOptions({ page: 0, pageSize: PER_GROUP, q }),
    enabled: active && perms.canView('sales'),
  });
  const doctorsQ = useQuery({
    ...getAdminListDoctorsQueryOptions({ search: q, limit: PER_GROUP }),
    enabled: active && perms.canView('masters'),
  });
  const productsQ = useQuery({
    ...getAdminListProductsQueryOptions({ search: q, limit: PER_GROUP }),
    enabled: active && perms.canView('masters'),
  });
  const posQ = useQuery({
    ...getAdminListPurchaseOrdersQueryOptions({ q, limit: PER_GROUP }),
    enabled: active && perms.canView('purchasing'),
  });
  const leadsQ = useQuery({
    ...leadsQueryOptions({ page: 0, pageSize: PER_GROUP, q }),
    enabled: active && perms.canView('crm'),
  });

  const groups: Group[] = [];
  const orders = unwrap<SalesOrderList>(ordersQ.data)?.items ?? [];
  if (orders.length) {
    groups.push({
      label: 'Sales orders',
      hits: orders.map((o) => ({
        key: `so-${o.uuid}`,
        title: o.order_number,
        subtitle: `${o.doctor_name} · ${o.status}`,
        to: `/sales-orders?view=${o.uuid}`,
      })),
    });
  }
  const doctors = unwrap<DoctorListResponse>(doctorsQ.data)?.results ?? [];
  if (doctors.length) {
    groups.push({
      label: 'Doctors',
      hits: doctors.map((d) => ({
        key: `doc-${d.id}`,
        title: d.name,
        subtitle: d.clinic_name ?? d.code,
        to: `/masters/doctors?q=${encodeURIComponent(d.name)}`,
      })),
    });
  }
  const products = unwrap<ProductListResponse>(productsQ.data)?.results ?? [];
  if (products.length) {
    groups.push({
      label: 'Products',
      hits: products.map((p) => ({
        key: `prod-${p.id}`,
        title: p.name,
        subtitle: p.code,
        to: `/masters/products?q=${encodeURIComponent(p.name)}`,
      })),
    });
  }
  const pos = unwrap<PurchaseOrderList>(posQ.data)?.items ?? [];
  if (pos.length) {
    groups.push({
      label: 'Purchase orders',
      hits: pos.map((po) => ({
        key: `po-${po.uuid}`,
        title: po.po_no,
        subtitle: po.vendor_name,
        to: `/purchase-orders?view=${po.uuid}`,
      })),
    });
  }
  const leads = unwrap<LeadList>(leadsQ.data)?.items ?? [];
  if (leads.length) {
    groups.push({
      label: 'Leads',
      hits: leads.map((l) => ({
        key: `lead-${l.uuid}`,
        title: l.contact_name,
        subtitle: `${l.clinic_name}${l.city ? ` · ${l.city}` : ''}`,
        to: `/crm/${l.uuid}`,
      })),
    });
  }

  const isLoading =
    ordersQ.isFetching || doctorsQ.isFetching || productsQ.isFetching || posQ.isFetching || leadsQ.isFetching;
  const showDropdown = open && term.trim().length >= 2;

  const go = (to: string) => {
    setOpen(false);
    setTerm('');
    navigate(to);
  };

  return (
    <div
      ref={containerRef}
      className={`relative hidden transition-[width] duration-200 sm:block ${
        open ? 'w-72 md:w-96' : 'w-56 md:w-72'
      }`}
      data-slot="header-search"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search anything…  (Ctrl+K)"
        aria-label="Global search"
        className="h-9 w-full rounded-md border border-border/50 bg-white pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/25"
      />

      {showDropdown && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 max-h-[480px] w-full overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
        >
          {groups.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {isLoading ? 'Searching…' : 'No matches'}
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.label}>
                <p className="bg-muted/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </p>
                {g.hits.map((h) => (
                  <button
                    key={h.key}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => go(h.to)}
                    className="block w-full px-4 py-2 text-left hover:bg-secondary"
                  >
                    <p className="truncate text-sm font-medium text-foreground">{h.title}</p>
                    {h.subtitle ? <p className="truncate text-xs text-muted-foreground">{h.subtitle}</p> : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
