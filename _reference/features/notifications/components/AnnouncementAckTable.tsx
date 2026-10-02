import { Check, Loader2, Minus } from 'lucide-react';
import { useAnnouncementRecipients } from '../hooks/useAnnouncements';
import { formatDateTime } from '../../../utils/format';

function fmt(iso: string | null | undefined): string {
  return iso ? formatDateTime(iso) : '';
}

export function AnnouncementAckTable({ announcementUuid }: { announcementUuid: string }) {
  const { data, isPending, isError } = useAnnouncementRecipients(announcementUuid);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Couldn&rsquo;t load recipients.</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-4 py-2 text-sm font-medium text-foreground">
        {data.acknowledged} of {data.total} acknowledged
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Recipient</th>
              <th className="px-4 py-2 font-medium">Read</th>
              <th className="px-4 py-2 font-medium">Acknowledged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((r) => (
              <tr key={r.user_uuid}>
                <td className="px-4 py-2 text-foreground">{r.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{fmt(r.read_at) || <Minus className="size-4" aria-hidden />}</td>
                <td className="px-4 py-2">
                  {r.acknowledged_at ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Check className="size-4" aria-hidden /> {fmt(r.acknowledged_at)}
                    </span>
                  ) : (
                    <Minus className="size-4 text-muted-foreground" aria-hidden />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
