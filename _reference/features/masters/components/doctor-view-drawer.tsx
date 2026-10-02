/**
 * Read-only Doctor view drawer: identity hero + the add/edit form's fields.
 * Opened from the table's View action / row click. Footer offers Doctor 360
 * alongside Close/Edit.
 */
import type { ReactNode } from 'react';
import { MapPin, Phone, Star, Stethoscope } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { WhatsAppTemplateButton } from '../../../common/whatsapp-button';
import { formatAddress } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import type { DoctorRow } from '../api/doctors';
import { ActivePill } from './ActivePill';

export interface DoctorViewDrawerProps {
  open: boolean;
  doctor: DoctorRow | null;
  onClose: () => void;
  onEdit: (doctor: DoctorRow) => void;
  onDoctor360: (doctor: DoctorRow) => void;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value ?? '—'}</dd>
    </div>
  );
}

export function DoctorViewDrawer({ open, doctor, onClose, onEdit, onDoctor360 }: DoctorViewDrawerProps) {
  const address = doctor ? formatAddress(doctor) : '';
  return (
    <CustomDrawer
      anchor="right"
      title="Doctor"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {doctor && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Stethoscope className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-base font-semibold text-foreground">
                    {doctor.name}
                    {doctor.is_vip && <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{doctor.code}</span>
                    {doctor.clinic_name ? ` · ${doctor.clinic_name}` : ''}
                  </p>
                </div>
              </div>
              <ActivePill active={doctor.is_active} />
            </div>

            {/* Mirrors the add/edit form fields exactly. */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Name" value={doctor.name} />
                <Field
                  label="Alias"
                  value={doctor.aliases && doctor.aliases.length > 0 ? doctor.aliases.join(', ') : '—'}
                />
                <Field label="Clinic" value={doctor.clinic_name ?? '—'} />
                <Field
                  label="Phone"
                  value={
                    doctor.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-muted-foreground" />
                        {formatIndianPhone(doctor.phone)}
                        <WhatsAppTemplateButton
                          phone={doctor.phone}
                          context="GENERAL"
                          fill={{ name: doctor.name, city: doctor.city }}
                          ariaLabel={`Message ${doctor.name} on WhatsApp`}
                        />
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <Field label="VIP doctor" value={doctor.is_vip ? 'Yes' : 'No'} />
              </dl>
            </SectionCard>

            <SectionCard title="Address">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">{address || '—'}</span>
              </div>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="outline" onClick={() => onDoctor360(doctor)}>
              Doctor 360
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(doctor)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
