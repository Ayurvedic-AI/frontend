import dayjs from 'dayjs';

/** "Today, 10:30 AM" / "Yesterday, 5:05 PM" / "29 Sep, 9:00 AM". */
export function consultationWhen(createdAt: string): string {
  const d = dayjs(createdAt);
  const days = dayjs().startOf('day').diff(d.startOf('day'), 'day');
  const day = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.format('DD MMM');
  return `${day}, ${d.format('h:mm A')}`;
}
