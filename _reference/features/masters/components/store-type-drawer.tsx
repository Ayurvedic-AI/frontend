/**
 * Store Type create/edit drawer: a minimal name-only master
 * (mirrors CategoryTypeDrawer).
 */
import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminCreateStoreType, useAdminUpdateStoreType } from '../../../sdk/inventory';
import type { StoreTypeRow } from '../api/store-types';
import {
  useStoreTypeForm,
  storeTypeFormDefaults,
  type StoreTypeFormValues,
} from '../hooks/use-create-store-type-form';

export interface StoreTypeDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  type?: StoreTypeRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function StoreTypeDrawer({ open, type, onClose, onSaved }: StoreTypeDrawerProps) {
  const { toast } = useToast();
  const isEdit = type != null;
  const { control, handleSubmit, reset, setError } = useStoreTypeForm(type);
  const { handleApiError } = useFormApiErrors(setError);

  // Re-seed the form when the target row changes (or the drawer re-opens).
  useEffect(() => {
    if (open) reset(storeTypeFormDefaults(type));
  }, [open, type, reset]);

  const onMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setError('name', { type: 'manual', message: errorMessage(error) });
      return;
    }
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateStoreType({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Store type created.') });
        reset(storeTypeFormDefaults());
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateStoreType({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Store type updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(storeTypeFormDefaults(type));
    onClose();
  };

  const onSubmit = (data: StoreTypeFormValues) => {
    const payload = { name: data.name };
    if (isEdit) updateMutation.mutate({ typeId: type.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit store type — ${type.name}` : 'Add store type'}
      open={open}
      onClose={handleClose}
      drawerWidth="28rem"
      drawerPadding="0px"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <RHFInput<StoreTypeFormValues>
            name="name"
            control={control}
            label="Name"
            required
            placeholder="Enter name"
          />
        </div>
        <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save changes' : 'Add type'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
