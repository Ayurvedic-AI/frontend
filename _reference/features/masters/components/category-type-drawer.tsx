/**
 * Category Type create/edit drawer (feature 047): a minimal name-only master.
 * One zod schema serves both modes (mirrors RmCategoryDrawer minus the extra fields).
 */
import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminCreateCategoryType, useAdminUpdateCategoryType } from '../../../sdk/inventory';
import type { CategoryTypeRow } from '../api/category-types';
import {
  useCategoryTypeForm,
  categoryTypeFormDefaults,
  type CategoryTypeFormValues,
} from '../hooks/use-create-category-type-form';

export interface CategoryTypeDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  type?: CategoryTypeRow | null;
  onClose: () => void;
  /** Create mode passes the created type so callers can auto-select it. */
  onSaved: (type?: CategoryTypeRow) => void;
}

export function CategoryTypeDrawer({ open, type, onClose, onSaved }: CategoryTypeDrawerProps) {
  const { toast } = useToast();
  const isEdit = type != null;
  const { control, handleSubmit, reset, setError } = useCategoryTypeForm(type);
  const { handleApiError } = useFormApiErrors(setError);

  // Re-seed the form when the target row changes (or the drawer re-opens).
  useEffect(() => {
    if (open) reset(categoryTypeFormDefaults(type));
  }, [open, type, reset]);

  const onMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setError('name', { type: 'manual', message: errorMessage(error) });
      return;
    }
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateCategoryType({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Category type created.') });
        reset(categoryTypeFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateCategoryType({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Category type updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(categoryTypeFormDefaults(type));
    onClose();
  };

  const onSubmit = (data: CategoryTypeFormValues) => {
    const payload = { name: data.name };
    if (isEdit) updateMutation.mutate({ typeId: type.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit category type — ${type.name}` : 'Add category type'}
      open={open}
      onClose={handleClose}
      drawerWidth="28rem"
      drawerPadding="0px"
    >
      {/* This drawer can stack over a host form (RM master); React bubbles
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
          <RHFInput<CategoryTypeFormValues>
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
