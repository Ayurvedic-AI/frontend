import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VendorRow } from '../api/vendors';
import {
  gstinOptional,
  emailOptional,
  stateCodeOptional,
  zipOptional,
} from '../../../utils/validation';

const vendorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  gstin: gstinOptional(),
  // Vendors can have landline/office numbers — any 10 digits is fine (the
  // mobile-only [6-9] rule used for doctors rejected them, blocking creates).
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{10}$/.test(v), 'Enter a valid 10-digit number'),
  email: emailOptional(),
  address_line1: z.string().trim().max(200).optional(),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  state_code: stateCodeOptional(),
  zip_code: zipOptional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
/** @deprecated kept for compatibility with the create-only era. */
export type CreateVendorFormValues = VendorFormValues;

const EMPTY: VendorFormValues = {
  name: '',
  gstin: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_code: '',
  zip_code: '',
};

export function vendorFormDefaults(vendor?: VendorRow | null): VendorFormValues {
  if (!vendor) return EMPTY;
  return {
    name: vendor.name,
    gstin: vendor.gstin ?? '',
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    address_line1: vendor.address_line1 ?? '',
    address_line2: vendor.address_line2 ?? '',
    city: vendor.city ?? '',
    state_code: vendor.state_code ?? '',
    zip_code: vendor.zip_code ?? '',
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useVendorForm(vendor?: VendorRow | null) {
  return useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendorFormDefaults(vendor),
    mode: 'onSubmit',
  });
}

/** @deprecated use `useVendorForm` (create+edit). */
export const useCreateVendorForm = useVendorForm;
