/**
 * Live record counts for the Masters hub cards (feature 027, US4): one
 * `limit=1` list call per masters-owned section — the server returns the
 * filtered total regardless of page size.
 */
import { useQueries } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { vendorsQueryOptions } from '../api/vendors';
import { productsQueryOptions } from '../api/products';
import { rawMaterialsQueryOptions } from '../api/raw-materials';
import { semiFinishedGoodsQueryOptions } from '../api/semi-finished-goods';
import { bomsQueryOptions } from '../api/boms';
import { doctorsQueryOptions } from '../api/doctors';
import { priceListQueryOptions } from '../api/price-list';
import { getAdminListStoresQueryOptions } from '../../../sdk/inventory';

const PROBE: MastersListQuery = { page: 0, pageSize: 1, sort: '-created_at' };

// Couriers / RM Categories / Doctor Aliases were removed with their dead hub
// cards (2026-07-02 dead-code sweep) — only live cards are counted.
const SECTION_OPTIONS = {
  vendors: vendorsQueryOptions,
  products: productsQueryOptions,
  'raw-materials': rawMaterialsQueryOptions,
  'semi-finished-goods': semiFinishedGoodsQueryOptions,
  boms: bomsQueryOptions,
  doctors: doctorsQueryOptions,
} as const;

type MastersSectionKey = keyof typeof SECTION_OPTIONS;

/** Countable hub sections — the masters-owned ones plus Stores (inventory-owned)
 * and the Price List (feature 070; `{ items, total }`-shaped like Stores). */
export type CountableSectionKey = MastersSectionKey | 'stores' | 'price-list';

const KEYS = Object.keys(SECTION_OPTIONS) as MastersSectionKey[];

interface CountEnvelope {
  data?: { count?: number };
}

interface StoresEnvelope {
  data?: { total?: number };
}

/** Map of section key → record count (undefined while loading / on error). */
export function useMastersCounts(): Partial<Record<CountableSectionKey, number>> {
  // Stores live under the inventory API (StoreList: { items, total }), not the
  // masters list shape, so they are probed as an extra query appended after the
  // masters sections.
  const results = useQueries({
    queries: [
      ...KEYS.map((key) => ({ ...SECTION_OPTIONS[key](PROBE), staleTime: 30_000 })),
      { ...getAdminListStoresQueryOptions(), staleTime: 30_000 },
      { ...priceListQueryOptions({ limit: 1, offset: 0 }), staleTime: 30_000 },
    ],
  });

  const counts: Partial<Record<CountableSectionKey, number>> = {};
  KEYS.forEach((key, index) => {
    const count = (results[index].data as CountEnvelope | undefined)?.data?.count;
    if (typeof count === 'number') counts[key] = count;
  });
  const storesTotal = (results[KEYS.length]?.data as StoresEnvelope | undefined)?.data?.total;
  if (typeof storesTotal === 'number') counts.stores = storesTotal;
  const priceListTotal = (results[KEYS.length + 1]?.data as StoresEnvelope | undefined)?.data?.total;
  if (typeof priceListTotal === 'number') counts['price-list'] = priceListTotal;
  return counts;
}
