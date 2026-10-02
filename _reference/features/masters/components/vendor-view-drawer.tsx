/**
 * Read-only Vendor view drawer: identity hero + contact / address / details
 * cards. Opened from the table's View action / row click.
 */
import type { ReactNode } from 'react';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { WhatsAppTemplateButton } from '../../../common/whatsapp-button';
import { formatAddress, formatDate } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import type { VendorRow } from '../api/vendors';
import { ActivePill } from './ActivePill';

export interface VendorViewDrawerProps {
  open: boolean;
  vendor: VendorRow | null;
  onClose: () => void;
  onEdit: (vendor: VendorRow) => void;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function VendorViewDrawer({ open, vendor, onClose, onEdit }: VendorViewDrawerProps) {
  const address = vendor ? formatAddress(vendor) : '';
  return (
    <CustomDrawer
      anchor="right"
      title="Vendor"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {vendor && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{vendor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {vendor.code}
                    {vendor.city ? ` · ${vendor.city}` : ''}
                  </p>
                </div>
              </div>
              <ActivePill active={vendor.is_active} />
            </div>

            {/* Contact */}
            <SectionCard title="Contact">
              <div className="flex flex-col gap-3">
                <ContactRow
                  icon={<Phone className="size-3.5" />}
                  label="Contact number"
                  value={
                    vendor.phone ? (
                      <span className="flex items-center gap-1.5">
                        {formatIndianPhone(vendor.phone)}
                        <WhatsAppTemplateButton
                          phone={vendor.phone}
                          context="GENERAL"
                          fill={{ name: vendor.name, city: vendor.city }}
                          ariaLabel={`Message ${vendor.name} on WhatsApp`}
                        />
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <ContactRow
                  icon={<Mail className="size-3.5" />}
                  label="Email"
                  value={
                    vendor.email ? (
                      <a href={`mailto:${vendor.email}`} className="break-all text-primary hover:underline">
                        {vendor.email}
                      </a>
                    ) : (
                      '—'
                    )
                  }
                />
                <ContactRow
                  icon={<MapPin className="size-3.5" />}
                  label="Address"
                  value={address || '—'}
                />
              </div>
            </SectionCard>

            {/* Business details */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">GSTIN</dt>
                  <dd className="font-mono font-medium text-foreground">{vendor.gstin ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vendor code</dt>
                  <dd className="font-medium text-foreground">{vendor.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Added</dt>
                  <dd className="font-medium text-foreground">{formatDate(vendor.created_at)}</dd>
                </div>
              </dl>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(vendor)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
