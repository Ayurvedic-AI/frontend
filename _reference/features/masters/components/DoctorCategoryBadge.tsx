import { doctorCategoryTone } from '../../../utils/doctor-category';

/** Doctor commercial-tier pill (Bronze/Silver/Gold/Diamond), styled like StageBadge. */
export function DoctorCategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${doctorCategoryTone(category)}`}
    >
      {category}
    </span>
  );
}
