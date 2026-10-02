/**
 * Vendor create/edit drawer (feature 027): one zod schema for both modes.
 */
import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { AddressFields } from '../../../common/address-fields';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminCreateVendor, useAdminUpdateVendor } from '../../../sdk/inventory';
import type { VendorListItem } from '../../../sdk/schemas';
import type { VendorRow } from '../api/vendors';
import { useVendorForm, vendorFormDefaults, type VendorFormValues } from '../hooks/useCreateVendorForm';

export interface VendorDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  vendor?: VendorRow | null;
  onClose: () => void;
  /** Create mode passes the created vendor so callers can auto-select it. */
  onSaved: (vendor?: VendorListItem) => void;
}

export function VendorDrawer({ open, vendor, onClose, onSaved }: VendorDrawerProps) {
  const { toast } = useToast();
  const isEdit = vendor != null;
  const { control, handleSubmit, reset, setError } = useVendorForm(vendor);
  const { handleApiError } = useFormApiErrors(setError);

  // Re-seed the form when the target row changes (or the drawer re-opens).
  useEffect(() => {
    if (open) reset(vendorFormDefaults(vendor));
  }, [open, vendor, reset]);

  const onMutationError = (error: unknown) => {
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateVendor({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Vendor created.') });
        reset(vendorFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateVendor({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Vendor updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(vendorFormDefaults(vendor));
    onClose();
  };

  const onSubmit = (data: VendorFormValues) => {
    const payload = {
      name: data.name,
      gstin: data.gstin || null,
      phone: data.phone || null,
      email: data.email || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state_code: data.state_code || null,
      zip_code: data.zip_code || null,
    };
    if (isEdit) updateMutation.mutate({ vendorId: vendor.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit vendor` : 'Add vendor'}
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {/* This drawer can stack over a host form (GRN/PO); React bubbles submit
          through portals, so stop it from also submitting the host. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
        className="flex min-h-full flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <RHFInput<VendorFormValues> name="name" control={control} label="Name" required placeholder="Enter name" />
          <RHFInput<VendorFormValues> name="gstin" control={control} label="GSTIN Number" uppercase placeholder="Enter GSTIN (optional)" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFInput<VendorFormValues> name="phone" control={control} label="Contact Number" phone placeholder="Enter 10-digit mobile" />
            <RHFInput<VendorFormValues> name="email" control={control} label="Email" placeholder="vendor@example.com" />
          </div>
          <AddressFields control={control} />
        </div>
        <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save changes' : 'Add vendor'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
