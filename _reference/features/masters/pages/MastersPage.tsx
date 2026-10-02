/**
 * Masters hub (feature 027, US4): the 11 sections grouped by business area —
 * Procurement / Production / Customers / Logistics — with live record counts
 * on the masters-owned cards. All pre-027 options are retained.
 */
import {
  ClipboardList,
  Factory,
  IndianRupee,
  Package,
  Stethoscope,
  Warehouse,
} from 'lucide-react';
import { MasterCard, type MasterSection } from '../components/MasterCard';
import { useMastersCounts, type CountableSectionKey } from '../hooks/use-masters-counts';

interface HubSection extends MasterSection {
  /** Key into the live-counts map; sections without it show no count badge. */
  countKey?: CountableSectionKey;
}

interface HubGroup {
  title: string;
  sections: HubSection[];
}

const GROUPS: HubGroup[] = [
  {
    title: 'Procurement',
    sections: [
      {
        key: 'vendors',
        label: 'Vendors',
        description: 'Raw-material suppliers (GSTIN, state)',
        icon: Factory,
        to: '/masters/vendors',
        ready: true,
        countKey: 'vendors',
      },
      {
        key: 'raw-materials',
        label: 'Raw Materials',
        description: 'Herbs, fruits & processed items',
        icon: Package,
        to: '/masters/raw-materials',
        ready: true,
        countKey: 'raw-materials',
      },
      {
        key: 'semi-finished-goods',
        label: 'Semi-Finished Goods',
        description: 'Churna, bharad & bhasma in bulk',
        icon: Package,
        to: '/masters/semi-finished-goods',
        ready: true,
        countKey: 'semi-finished-goods',
      },
    ],
  },
  {
    title: 'Production',
    sections: [
      // {
      //   key: 'semi-finished-goods',
      //   label: 'Semi-Finished Goods',
      //   description: 'Churna, bharad & bhasma in bulk',
      //   icon: Package,
      //   to: '/masters/semi-finished-goods',
      //   ready: true,
      //   countKey: 'semi-finished-goods',
      // },
      {
        key: 'products',
        label: 'Finished Good Products',
        description: 'Finished goods — HSN, MRP, GST',
        icon: Package,
        to: '/masters/products',
        ready: true,
        countKey: 'products',
      },
      {
        key: 'boms',
        label: 'BOMs',
        description: 'Bill-of-materials recipes',
        icon: ClipboardList,
        to: '/masters/boms',
        ready: true,
        countKey: 'boms',
      },
      {
        key: 'stores',
        label: 'Stores',
        description: 'Inventory storage locations (FG & RM)',
        icon: Warehouse,
        to: '/masters/stores',
        ready: true,
        countKey: 'stores',
      },
    ],
  },
  {
    title: 'Customers',
    sections: [
      {
        key: 'doctors',
        label: 'Doctors',
        description: 'Customer master',
        icon: Stethoscope,
        to: '/masters/doctors',
        ready: true,
        countKey: 'doctors',
      },
      {
        key: 'price-list',
        label: 'Price List',
        description: 'Product prices by pack / variant',
        icon: IndianRupee,
        to: '/masters/price-list',
        ready: true,
        countKey: 'price-list',
      },
    ],
  },
];

export function MastersPage() {
  const counts = useMastersCounts();

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Masters</h1>
        {/* <p className="mt-1 text-sm text-muted-foreground">
          Reference data. Pick a section to manage entries and their documents.
        </p> */}
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-8 first-of-type:mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.sections.map(({ key, countKey, ...section }) => (
              <MasterCard
                key={key}
                {...section}
                count={countKey ? counts[countKey] : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default MastersPage;
