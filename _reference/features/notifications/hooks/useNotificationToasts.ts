import { useEffect, useRef } from 'react';
import { toast } from '../../../common/common-snackbar';
import type { NotificationOut } from '../api/notifications';

/**
 * Fires a transient toast for newly-arrived notifications that are CRITICAL or
 * require acknowledgment (FR-007a / research D-008). Ordinary arrivals update the
 * bell/list silently. The first poll seeds the "seen" set without toasting so a
 * backlog isn't dumped as toasts on mount.
 */
export function useNotificationToasts(items: NotificationOut[] | undefined): void {
  const seen = useRef<Set<string>>(new Set());
  const seeded = useRef(false);

  useEffect(() => {
    if (!items) return;

    if (!seeded.current) {
      items.forEach((n) => seen.current.add(n.uuid));
      seeded.current = true;
      return;
    }

    for (const n of items) {
      if (seen.current.has(n.uuid)) continue;
      seen.current.add(n.uuid);
      const important = n.severity === 'CRITICAL' || n.requires_acknowledgment;
      if (!important || n.read_at) continue;
      toast({
        message: n.title,
        severity: n.severity === 'CRITICAL' ? 'error' : 'warning',
        duration: 8000,
        id: `notif-${n.uuid}`,
      });
    }
  }, [items]);
}
