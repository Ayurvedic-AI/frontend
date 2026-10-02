import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAdminListProductsQueryOptions,
  getAdminListRawMaterialsQueryOptions,
  getAdminListSemiFinishedGoodsQueryOptions,
} from '../../../sdk/inventory';
import type {
  ProductListResponse,
  RawMaterialListResponse,
  SemiFinishedGoodListResponse,
} from '../../../sdk/schemas';

/**
 * material_code → category name map from the Raw Material master (076).
 * "Category" here is what the RM master's Category column shows —
 * category_type_name (047), with the older rm_category_name as fallback.
 * Used to enrich allocation displays/prints, which don't carry a category.
 */
export function useRmCategoryMap(enabled: boolean) {
  const rmQuery = useQuery(
    // Backend caps `limit` at 100 (le=100).
    getAdminListRawMaterialsQueryOptions({ limit: 100 }, { query: { enabled } }),
  );
  const rmData = (rmQuery.data as { data?: RawMaterialListResponse } | undefined)?.data;
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const rm of rmData?.results ?? []) {
      const category = rm.category_type_name ?? rm.rm_category_name;
      if (category) map.set(rm.code, category);
    }
    return map;
  }, [rmData]);
}

/**
 * material NAME → category name, merged across the Raw Material, Semi-Finished
 * Good and Product masters.
 *
 * Keyed by name (not code) because BOM-order snapshot lines (BomOrderLineOut)
 * carry no material link at all — only `ingredient_name`. Best-effort by
 * nature: a renamed master or a free-text ingredient simply won't resolve, and
 * an unresolved name yields no chip rather than a wrong one.
 *
 * Category precedence matches each master's own Category column: RM uses
 * category_type_name with rm_category_name as fallback (047/076).
 */
export function useMaterialCategoryByName(enabled: boolean) {
  // Backend caps `limit` at 100 (le=100) on all three lists.
  const rmQuery = useQuery(
    getAdminListRawMaterialsQueryOptions({ limit: 100 }, { query: { enabled } }),
  );
  const sfgQuery = useQuery(
    getAdminListSemiFinishedGoodsQueryOptions({ limit: 100 }, { query: { enabled } }),
  );
  const productQuery = useQuery(
    getAdminListProductsQueryOptions({ limit: 100 }, { query: { enabled } }),
  );

  const rmData = (rmQuery.data as { data?: RawMaterialListResponse } | undefined)?.data;
  const sfgData = (sfgQuery.data as { data?: SemiFinishedGoodListResponse } | undefined)?.data;
  const productData = (productQuery.data as { data?: ProductListResponse } | undefined)?.data;

  return useMemo(() => {
    const map = new Map<string, string>();
    const put = (name?: string | null, category?: string | null) => {
      const key = (name ?? '').trim().toLowerCase();
      // First master wins, so a name collision can't flip an RM's category.
      if (key && category && !map.has(key)) map.set(key, category);
    };
    for (const rm of rmData?.results ?? []) put(rm.name, rm.category_type_name ?? rm.rm_category_name);
    for (const sfg of sfgData?.results ?? []) put(sfg.name, sfg.sfg_category_name);
    for (const p of productData?.results ?? []) put(p.name, p.category);
    return map;
  }, [rmData, sfgData, productData]);
}
