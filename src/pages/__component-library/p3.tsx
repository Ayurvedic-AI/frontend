import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  ActionMenu,
  ConfirmationPopUp,
  CustomButton,
  CustomDialog,
  CustomDrawer,
  useToast,
} from '../../common';

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CustomButton onClick={() => setOpen(true)}>Open dialog</CustomButton>
      <CustomDialog title="Modal dialog" open={open} onClose={() => setOpen(false)} width={520}>
        <p className="text-sm leading-relaxed">
          Built on Radix Dialog. Escape closes the modal and returns focus to the trigger.
          The overlay click also calls <code>onClose</code> with <code>reason="backdropClick"</code>.
        </p>
      </CustomDialog>
    </>
  );
}

function DrawerDemo({ anchor }: { anchor: 'left' | 'right' | 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CustomButton variant="outline" onClick={() => setOpen(true)}>
        {anchor}
      </CustomButton>
      <CustomDrawer
        open={open}
        anchor={anchor}
        title={`${anchor} drawer`}
        onClose={() => setOpen(false)}
      >
        <p className="text-sm leading-relaxed">
          Drawers slide in from the <strong>{anchor}</strong> edge. On phones they take the full
          width / height. On larger viewports the right/left variants default to ~40 vw.
        </p>
      </CustomDrawer>
    </>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <CustomButton size="sm" onClick={() => toast({ severity: 'info', message: 'Just so you know…' })}>
        Info
      </CustomButton>
      <CustomButton
        size="sm"
        variant="outline"
        onClick={() => toast({ severity: 'success', message: 'Saved successfully' })}
      >
        Success
      </CustomButton>
      <CustomButton
        size="sm"
        variant="secondary"
        onClick={() =>
          toast({
            severity: 'warning',
            message: 'Be careful — this is reversible.',
            duration: 6_000,
          })
        }
      >
        Warning
      </CustomButton>
      <CustomButton
        size="sm"
        variant="destructive"
        onClick={() =>
          toast({
            severity: 'error',
            message: 'Network error. Click to retry.',
            action: { label: 'Retry', onClick: () => alert('retrying…') },
          })
        }
      >
        Error w/ action
      </CustomButton>
    </div>
  );
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CustomButton variant="destructive" onClick={() => setOpen(true)}>
        Delete item…
      </CustomButton>
      <ConfirmationPopUp
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          alert('Deleted!');
          setOpen(false);
        }}
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}

function ActionMenuDemo() {
  return (
    <ActionMenu
      items={[
        { label: 'Edit', icon: <Edit2 className="size-3.5" />, onClick: () => alert('Edit') },
        {
          label: 'Delete',
          icon: <Trash2 className="size-3.5" />,
          onClick: () => alert('Delete'),
          color: 'rgb(220 38 38)',
        },
      ]}
    />
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}

export function P3Demo() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overlays &amp; feedback (P3)</h2>
        <p className="text-sm text-muted-foreground">
          Dialog, drawer (four anchors), snackbar (imperative <code>toast()</code>), confirmation,
          and contextual action menu. Built on Radix + sonner.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="custom-dialog">
          <DialogDemo />
        </Card>
        <Card title="custom-drawer">
          <DrawerDemo anchor="right" />
          <DrawerDemo anchor="left" />
          <DrawerDemo anchor="top" />
          <DrawerDemo anchor="bottom" />
        </Card>
        <Card title="common-snackbar (sonner)">
          <ToastDemo />
        </Card>
        <Card title="confirmation-pop-up">
          <ConfirmDemo />
        </Card>
        <Card title="action-menu">
          <ActionMenuDemo />
        </Card>
      </div>
    </div>
  );
}

export default P3Demo;
