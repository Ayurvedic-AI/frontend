import { cn } from '../../../lib/cn';
import { describeActivity, activityToneClass } from '../../../utils/activity';

/** Icon + plain-English description for an audit action (end-user friendly). */
export function ActivityAction({
  action,
  entityType,
}: {
  action: string;
  entityType?: string | null;
}) {
  const { label, Icon, tone } = describeActivity(action, entityType);
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-full',
          activityToneClass(tone),
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}
