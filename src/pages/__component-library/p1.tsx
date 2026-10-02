import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Search, User } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CustomButton,
  CustomCheckbox,
  CustomInput,
  CustomLabel,
  CustomRadio,
  CustomRadioGroup,
  CustomSelect,
  CustomTextArea,
  RHFCheckbox,
  RHFInput,
  RHFRadioGroup,
  RHFSelect,
  RHFTextarea,
  type ButtonVariant,
  type ButtonSize,
} from '../../common';

// ── Canonical form pattern ──────────────────────────────────────────────────

const demoSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\d{10}$/, 'Enter 10 digits'),
  role: z.enum(['engineer', 'designer', 'pm']),
  bio: z.string().max(200, 'Max 200 characters'),
  contactMethod: z.enum(['email', 'phone']),
  acceptsMarketing: z.boolean(),
});

type DemoForm = z.infer<typeof demoSchema>;

function CanonicalFormDemo() {
  const form = useForm<DemoForm>({
    resolver: zodResolver(demoSchema),
    defaultValues: { acceptsMarketing: false, role: 'engineer', contactMethod: 'email' },
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data) => alert(JSON.stringify(data, null, 2)))}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <RHFInput<DemoForm>
          name="fullName"
          placeholder="Full name"
          label="Full name"
          required
        />
        <RHFInput<DemoForm>
          name="email"
          placeholder="you@example.com"
          label="Email"
          isEmail
          required
        />
        <RHFInput<DemoForm>
          name="phone"
          placeholder="Enter 10-digit mobile"
          label="Phone"
          phone
          required
        />
        <RHFSelect<DemoForm>
          name="role"
          placeholder="Pick a role"
          label="Role"
          items={[
            { value: 'engineer', label: 'Engineer' },
            { value: 'designer', label: 'Designer' },
            { value: 'pm', label: 'Product manager' },
          ]}
          required
        />
        <div className="sm:col-span-2">
          <RHFTextarea<DemoForm>
            name="bio"
            placeholder="Tell us about yourself…"
            label="Bio"
            minRow={3}
            maxRow={6}
          />
        </div>
        <div className="sm:col-span-2">
          <RHFRadioGroup<DemoForm, 'email' | 'phone'>
            name="contactMethod"
            label="Preferred contact"
            orientation="horizontal"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <RHFCheckbox<DemoForm>
            name="acceptsMarketing"
            label="Send me product updates"
            supportingText="You can unsubscribe at any time."
          />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2">
          <CustomButton variant="ghost" type="button" onClick={() => form.reset()}>
            Reset
          </CustomButton>
          <CustomButton type="submit" loading={form.formState.isSubmitting}>
            Submit
          </CustomButton>
        </div>
      </form>
    </FormProvider>
  );
}

// ── State matrix: render each P1 control in 4 states ────────────────────────

function StateRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function StateCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ComponentMatrix() {
  return (
    <div className="space-y-8">
      <StateRow title="custom-input">
        <StateCard label="Default">
          <CustomInput name="i1" placeholder="Type here" value="" onChange={() => {}} />
        </StateCard>
        <StateCard label="With start icon">
          <CustomInput
            name="i2"
            placeholder="Search"
            value=""
            onChange={() => {}}
            icon={<Search aria-hidden className="size-4" />}
          />
        </StateCard>
        <StateCard label="Error">
          <CustomInput
            name="i3"
            placeholder="Email"
            value="not-an-email"
            onChange={() => {}}
            hasError
            errorMessage="Enter a valid email"
          />
        </StateCard>
        <StateCard label="Disabled">
          <CustomInput
            name="i4"
            placeholder="Disabled"
            value="cannot edit"
            onChange={() => {}}
            disableField
          />
        </StateCard>
      </StateRow>

      <StateRow title="custom-text-area">
        <StateCard label="Default (min 2 rows)">
          <CustomTextArea name="t1" placeholder="Type…" value="" minRow={2} onChange={() => {}} />
        </StateCard>
        <StateCard label="With content">
          <CustomTextArea
            name="t2"
            placeholder=""
            value="The textarea auto-resizes between min and max rows."
            minRow={2}
            maxRow={6}
            onChange={() => {}}
          />
        </StateCard>
        <StateCard label="Error">
          <CustomTextArea
            name="t3"
            placeholder="Bio"
            value=""
            minRow={2}
            onChange={() => {}}
            hasError
            errorMessage="Required"
          />
        </StateCard>
        <StateCard label="Disabled">
          <CustomTextArea
            name="t4"
            placeholder="Disabled"
            value="read-only"
            minRow={2}
            onChange={() => {}}
            isDisabled
          />
        </StateCard>
      </StateRow>

      <StateRow title="custom-select">
        <StateCard label="Default">
          <CustomSelect
            name="s1"
            placeholder="Pick one"
            value=""
            items={[
              { value: 'a', label: 'Apple' },
              { value: 'b', label: 'Banana' },
              { value: 'c', label: 'Cherry' },
            ]}
            onChange={() => {}}
          />
        </StateCard>
        <StateCard label="Selected">
          <CustomSelect
            name="s2"
            placeholder="Pick one"
            value="b"
            items={[
              { value: 'a', label: 'Apple' },
              { value: 'b', label: 'Banana' },
              { value: 'c', label: 'Cherry' },
            ]}
            onChange={() => {}}
          />
        </StateCard>
        <StateCard label="Error">
          <CustomSelect
            name="s3"
            placeholder="Required"
            value=""
            items={[{ value: 'a', label: 'Apple' }]}
            onChange={() => {}}
            hasError
            errorMessage="Required"
          />
        </StateCard>
        <StateCard label="Disabled">
          <CustomSelect
            name="s4"
            placeholder="Disabled"
            value=""
            items={[{ value: 'a', label: 'Apple' }]}
            onChange={() => {}}
            isDisabled
          />
        </StateCard>
      </StateRow>

      <StateRow title="custom-checkbox">
        <StateCard label="Unchecked">
          <CustomCheckbox label="Subscribe" />
        </StateCard>
        <StateCard label="Checked">
          <CustomCheckbox label="Subscribe" checked />
        </StateCard>
        <StateCard label="Indeterminate">
          <CustomCheckbox label="Select all" indeterminate />
        </StateCard>
        <StateCard label="Disabled">
          <CustomCheckbox label="Disabled" disabled supportingText="cannot toggle" />
        </StateCard>
      </StateRow>

      <StateRow title="custom-radio">
        <StateCard label="Single — unchecked">
          <CustomRadio label="Option A" />
        </StateCard>
        <StateCard label="Single — checked">
          <CustomRadio label="Option A" checked />
        </StateCard>
        <StateCard label="Group — vertical">
          <CustomRadioGroup
            name="r-group-v"
            defaultValue="x"
            options={[
              { value: 'x', label: 'Option X' },
              { value: 'y', label: 'Option Y' },
              { value: 'z', label: 'Option Z' },
            ]}
          />
        </StateCard>
        <StateCard label="Group — horizontal">
          <CustomRadioGroup
            name="r-group-h"
            defaultValue="x"
            orientation="horizontal"
            options={[
              { value: 'x', label: 'X' },
              { value: 'y', label: 'Y' },
              { value: 'z', label: 'Z' },
            ]}
          />
        </StateCard>
      </StateRow>

      <StateRow title="custom-label">
        <StateCard label="Default">
          <CustomLabel label="Name" />
        </StateCard>
        <StateCard label="Required">
          <CustomLabel label="Email" isRequired />
        </StateCard>
        <StateCard label="With tooltip">
          <CustomLabel label="API key" tooltip="Found under Settings → Developer." />
        </StateCard>
        <StateCard label="Large">
          <CustomLabel label="Section heading" size="lg" />
        </StateCard>
      </StateRow>
    </div>
  );
}

// ── Button gallery: every variant × size ─────────────────────────────────────

function ButtonGallery() {
  const variants: ButtonVariant[] = [
    'primary',
    'secondary',
    'outline',
    'ghost',
    'destructive',
    'icon',
    'floating',
    'black-filled',
  ];
  const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <section key={variant} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{variant}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sizes.map((size) => (
              <CustomButton key={size} variant={variant} size={size}>
                {variant === 'icon' || variant === 'floating' ? <Mail className="size-4" /> : `Button ${size}`}
              </CustomButton>
            ))}
            <CustomButton variant={variant} disabled>
              {variant === 'icon' || variant === 'floating' ? <User className="size-4" /> : 'Disabled'}
            </CustomButton>
            <CustomButton variant={variant} loading>
              {variant === 'icon' || variant === 'floating' ? null : 'Loading'}
            </CustomButton>
          </div>
        </section>
      ))}
    </div>
  );
}

// ── Page composition ─────────────────────────────────────────────────────────

export function P1Demo() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Canonical form (Zod + react-hook-form)</h2>
        <p className="text-sm text-muted-foreground">
          One Zod schema; types inferred via <code className="rounded bg-secondary px-1">z.infer</code>;
          every input wired through an <code className="rounded bg-secondary px-1">RHF*</code> wrapper.
        </p>
        <CanonicalFormDemo />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Component state matrix</h2>
        <p className="text-sm text-muted-foreground">
          Each P1 control rendered in four representative states (default / non-default / error / disabled).
        </p>
        <ComponentMatrix />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button gallery</h2>
        <p className="text-sm text-muted-foreground">
          Every <code className="rounded bg-secondary px-1">variant</code> × <code className="rounded bg-secondary px-1">size</code>,
          plus disabled and loading states. Tap targets ≥ 44 px on <code className="rounded bg-secondary px-1">md</code> and up.
        </p>
        <ButtonGallery />
      </section>
    </div>
  );
}

export default P1Demo;
