import { useMemo, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/cn';
import { waLink, copyToClipboard } from '../../utils/whatsapp';
import { fillTemplate, templatePreview, type TemplateFillValues } from '../../utils/message-template';
import { useToast } from '../common-snackbar';
import { useSession } from '../../features/auth/hooks/use-session';
import { getAdminListMessageTemplatesQueryOptions } from '../../sdk/crm';
import type { MessageTemplateList, MessageTemplateOut } from '../../sdk/schemas';
import { WhatsAppGlyph } from './whatsapp-button';

export type TemplateContext = MessageTemplateOut['category'];

interface WhatsAppTemplateButtonProps {
  phone: string | null | undefined;
  /** Which templates this screen surfaces first (its category + GENERAL). */
  context: TemplateContext;
  /** Fills {name}/{clinic}/{city}; {agent} comes from the logged-in session. */
  fill: Omit<TemplateFillValues, 'agent'>;
  ariaLabel?: string;
}

interface Envelope {
  data: MessageTemplateList;
  status: number;
}

const LAST_USED_KEY = (context: string) => `wa-template-last:${context}`;

/** WhatsApp icon that opens a context-aware template picker: this screen's
 * category first (last-used on top), then GENERAL, then the rest — every row
 * previews the FILLED message. Selecting copies the text and opens wa.me.
 * Renders nothing without a usable mobile number (masked numbers included). */
export function WhatsAppTemplateButton({ phone, context, fill, ariaLabel = 'Message on WhatsApp' }: WhatsAppTemplateButtonProps) {
  const { toast } = useToast();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const agent =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    (user?.email ? user.email.split('@', 1)[0] : '');
  const values: TemplateFillValues = { ...fill, agent };

  const query = useQuery({
    ...getAdminListMessageTemplatesQueryOptions({ limit: 100, offset: 0 }),
    enabled: fetchEnabled,
    staleTime: 60_000,
  });
  const envelope = query.data as Envelope | undefined;

  const ordered = useMemo(() => {
    const templates = envelope?.data.items ?? [];
    const lastUsed = localStorage.getItem(LAST_USED_KEY(context));
    const rank = (t: MessageTemplateOut) => (t.category === context ? 0 : t.category === 'GENERAL' ? 1 : 2);
    return [...templates].sort((a, b) => {
      if (a.uuid === lastUsed && b.uuid !== lastUsed) return -1;
      if (b.uuid === lastUsed && a.uuid !== lastUsed) return 1;
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
  }, [envelope, context]);

  if (!waLink(phone)) return null;

  const send = (text: string, templateUuid?: string) => {
    // Blank template (meeting 2): empty text opens the chat with nothing
    // prefilled — the user types their own message.
    const href = waLink(phone, text || undefined);
    if (!href) return;
    if (templateUuid) localStorage.setItem(LAST_USED_KEY(context), templateUuid);
    if (text) {
      void copyToClipboard(text).then((ok) => {
        if (ok) toast({ severity: 'success', message: 'Message copied for WhatsApp.' });
      });
    }
    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const fallbackGreeting = fillTemplate(
    'Namaste {name}, greetings from Shree Vishwarang Ayurvedic.',
    values,
  );

  return (
    <DropdownMenuPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFetchEnabled(true);
      }}
    >
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          title={ariaLabel}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#25D366] transition-colors hover:bg-[#25D366]/10"
        >
          <WhatsAppGlyph className="size-4" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'z-50 flex w-80 flex-col rounded-lg border border-border bg-background shadow-lg',
            // Never taller than the space to the viewport edge — the list scrolls
            // inside instead of running off-screen and being clipped.
            'max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          <p className="shrink-0 border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Send via WhatsApp
          </p>
          {query.isPending && fetchEnabled ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Loading templates…</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {ordered.map((t) => (
                <DropdownMenuPrimitive.Item
                  key={t.uuid}
                  onSelect={(e) => {
                    e.preventDefault();
                    send(fillTemplate(t.body, values), t.uuid);
                  }}
                  className={cn(
                    'flex cursor-pointer select-none flex-col gap-0.5 rounded px-3 py-2 outline-none',
                    'data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground',
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{templatePreview(t.body, values)}</span>
                </DropdownMenuPrimitive.Item>
              ))}
              <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />
              <DropdownMenuPrimitive.Item
                onSelect={(e) => {
                  e.preventDefault();
                  send(fallbackGreeting);
                }}
                className={cn(
                  'flex cursor-pointer select-none flex-col gap-0.5 rounded px-3 py-2 outline-none',
                  'data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground',
                )}
              >
                <span className="text-sm font-medium text-foreground">Quick greeting</span>
                <span className="text-xs text-muted-foreground">{templatePreview(fallbackGreeting, values)}</span>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item
                onSelect={(e) => {
                  e.preventDefault();
                  send('');
                }}
                className={cn(
                  'flex cursor-pointer select-none flex-col gap-0.5 rounded px-3 py-2 outline-none',
                  'data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground',
                )}
              >
                <span className="text-sm font-medium text-foreground">Blank message</span>
                <span className="text-xs text-muted-foreground">Open the chat and type your own message</span>
              </DropdownMenuPrimitive.Item>
            </div>
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
