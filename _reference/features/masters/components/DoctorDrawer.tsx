/**
 * Doctor create/edit drawer (feature 027): one zod schema for both modes.
 * Code is auto-generated server-side (DOC-NNN); the Alias field reads/writes
 * the doctor-aliases master (one alias surfaced here).
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput, RHFCheckbox } from '../../../common/rhf-wrappers';
import { AddressFields } from '../../../common/address-fields';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import {
  getAdminListDoctorAliasesQueryOptions,
  useAdminCreateDoctor,
  useAdminUpdateDoctor,
  useAdminCreateDoctorAlias,
  useAdminUpdateDoctorAlias,
  useAdminSetDoctorAliasStatus,
} from '../../../sdk/inventory';
import type { DoctorAliasListResponse, DoctorListItem } from '../../../sdk/schemas';
import type { DoctorRow } from '../api/doctors';
import { useDoctorForm, doctorFormDefaults, type DoctorFormValues } from '../hooks/useCreateDoctorForm';

export interface DoctorDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  doctor?: DoctorRow | null;
  /** CREATE-mode prefill (e.g. "Add to doctor master" from a WON CRM lead) —
   *  seeds the form without switching to edit mode. Ignored when editing. */
  seed?: Partial<DoctorRow> | null;
  onClose: () => void;
  /** Fired after save; create passes the new row so callers can auto-select it. */
  onSaved: (item?: DoctorRow) => void;
}

interface AliasesEnvelope {
  data: DoctorAliasListResponse;
  status: number;
}

export function DoctorDrawer({ open, doctor, seed, onClose, onSaved }: DoctorDrawerProps) {
  const { toast } = useToast();
  const isEdit = doctor != null;
  // Create-mode prefill: the seed only feeds form defaults, never edit mode.
  const formSource = doctor ?? seed;
  const { control, handleSubmit, reset, setError } = useDoctorForm(formSource);
  const { handleApiError } = useFormApiErrors(setError);

  // Edit mode: load ALL of the doctor's alias rows (not just active ones) so a
  // retype of a deactivated alias reactivates the row instead of clashing with
  // the doctor_id+alias unique constraint.
  const aliasesQuery = useQuery({
    ...getAdminListDoctorAliasesQueryOptions({ doctor_id: doctor?.id, limit: 100 }),
    enabled: open && isEdit,
  });
  const aliasRows = (aliasesQuery.data as AliasesEnvelope | undefined)?.data.results ?? [];
  const activeAlias = aliasRows.find((a) => a.is_active);
  const currentAlias = activeAlias?.alias ?? '';

  // Re-seed the form when the target row changes (or the drawer re-opens).
  useEffect(() => {
    if (open) reset(doctorFormDefaults(formSource, currentAlias));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctor, seed, currentAlias, reset]);

  const createMutation = useAdminCreateDoctor();
  const updateMutation = useAdminUpdateDoctor();
  const createAliasMutation = useAdminCreateDoctorAlias();
  const updateAliasMutation = useAdminUpdateDoctorAlias();
  const aliasStatusMutation = useAdminSetDoctorAliasStatus();

  const handleClose = () => {
    reset(doctorFormDefaults(doctor, currentAlias));
    onClose();
  };

  /** Reconcile the Alias input with the doctor-aliases master. */
  const syncAlias = async (doctorId: number, alias: string) => {
    const trimmed = alias.trim();
    // Prefer the active row; otherwise reuse a deactivated one (reactivate).
    const row = activeAlias ?? (isEdit ? aliasRows[0] : undefined);
    if (trimmed) {
      if (!row) {
        await createAliasMutation.mutateAsync({ data: { doctor_id: doctorId, alias: trimmed } });
        return;
      }
      if (row.alias !== trimmed) {
        await updateAliasMutation.mutateAsync({ aliasId: row.id, data: { alias: trimmed } });
      }
      if (!row.is_active) {
        await aliasStatusMutation.mutateAsync({ aliasId: row.id, data: { is_active: true } });
      }
    } else if (row && row.is_active) {
      // Cleared in the form → hide the alias (no hard delete endpoint).
      await aliasStatusMutation.mutateAsync({ aliasId: row.id, data: { is_active: false } });
    }
  };

  const onSubmit = async (data: DoctorFormValues) => {
    const payload = {
      name: data.name,
      clinic_name: data.clinic_name || null,
      phone: data.phone || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      state_code: data.state_code || null,
      city: data.city || null,
      zip_code: data.zip_code || null,
      is_vip: data.is_vip,
    };

    let doctorId: number;
    let saveResponse: unknown;
    try {
      if (isEdit) {
        saveResponse = await updateMutation.mutateAsync({ doctorId: doctor.id, data: payload });
        doctorId = doctor.id;
      } else {
        const response = await createMutation.mutateAsync({ data: payload });
        saveResponse = response;
        // A non-2xx create rejects the promise, so the envelope body is the row.
        doctorId = (response.data as DoctorListItem).id;
      }
    } catch (error) {
      const general = handleApiError(error);
      toast({ severity: 'error', message: general ?? errorMessage(error) });
      return;
    }

    try {
      await syncAlias(doctorId, data.alias ?? '');
    } catch (error) {
      // The doctor itself saved — surface the alias failure but finish the flow.
      toast({ severity: 'error', message: `Doctor saved, but the alias failed: ${errorMessage(error)}` });
      void aliasesQuery.refetch();
      onSaved();
      onClose();
      return;
    }

    toast({
      severity: 'success',
      message: successMessage(saveResponse, isEdit ? 'Doctor updated.' : 'Doctor created.'),
    });
    if (!isEdit) reset(doctorFormDefaults());
    void aliasesQuery.refetch();
    onSaved((saveResponse as { data?: DoctorRow } | undefined)?.data);
    onClose();
  };

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    createAliasMutation.isPending ||
    updateAliasMutation.isPending ||
    aliasStatusMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit doctor — ${doctor.name}` : 'Add doctor'}
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {/* This drawer can stack over a host form (sales order); React bubbles
          submit through portals, so stop it from also submitting the host. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
        className="flex min-h-full flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFInput<DoctorFormValues> name="name" control={control} label="Name" required placeholder="Enter name" />
            <RHFInput<DoctorFormValues> name="alias" control={control} label="Alias" placeholder="Enter alias" />
          </div>
          <RHFInput<DoctorFormValues> name="clinic_name" control={control} label="Clinic" placeholder="Enter clinic name" />
          <RHFInput<DoctorFormValues> name="phone" control={control} label="Phone" phone placeholder="Enter 10-digit mobile" />
          <RHFCheckbox<DoctorFormValues>
            name="is_vip"
            control={control}
            label="VIP doctor (priority — shown first with a star)"
          />
          <AddressFields control={control} />
        </div>
        <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save changes' : 'Add doctor'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
