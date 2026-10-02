/**
 * SFG Category create/edit drawer: a name-only managed master, SEPARATE from
 * the RM category types (client 2026-07-09). Used by the Semi-Finished Goods →
 * Manage categories page AND stacked over the SFG form for inline creation
 * (label-row "+ Add new" pattern). One zod schema serves both modes.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminCreateSfgCategory, useAdminUpdateSfgCategory } from '../../../sdk/inventory';
import type { SfgCategoryRow } from '../api/sfg-categories';

const schema = z.object({ name: z.string().trim().min(1, 'Name is required').max(200) });
type FormValues = z.infer<typeof schema>;

const formDefaults = (category?: SfgCategoryRow | null): FormValues => ({
  name: category?.name ?? '',
});

export interface SfgCategoryDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  category?: SfgCategoryRow | null;
  onClose: () => void;
  /** Create mode passes the created category so callers can auto-select it. */
  onSaved: (category?: SfgCategoryRow) => void;
}

export function SfgCategoryDrawer({ open, category, onClose, onSaved }: SfgCategoryDrawerProps) {
  const { toast } = useToast();
  const isEdit = category != null;
  const { control, handleSubmit, reset, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaults(category),
    mode: 'onSubmit',
  });
  const { handleApiError } = useFormApiErrors(setError);

  // Re-seed the form when the target row changes (or the drawer re-opens).
  useEffect(() => {
    if (open) reset(formDefaults(category));
  }, [open, category, reset]);

  const onMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setError('name', { type: 'manual', message: errorMessage(error) });
      return;
    }
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateSfgCategory({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Category added.') });
        reset(formDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateSfgCategory({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Category updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(formDefaults(category));
    onClose();
  };

  const onSubmit = (data: FormValues) => {
    const payload = { name: data.name };
    if (isEdit) updateMutation.mutate({ categoryId: category.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit SFG category — ${category.name}` : 'Add SFG category'}
      open={open}
      onClose={handleClose}
      drawerWidth="28rem"
      drawerPadding="0px"
    >
      {/* This drawer can stack over the SFG form; React bubbles submit through
          portals, so stop it from also submitting the host. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
        className="flex min-h-full flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <RHFInput<FormValues> name="name" control={control} label="Name" required placeholder="e.g. Bharad" />
        </div>
        <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose} size="md">
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={saving} size="md">
            {isEdit ? 'Save changes' : 'Save'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
