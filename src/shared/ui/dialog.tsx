import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@shared/lib/utils';
import { CloseIcon } from '@shared/ui/icons';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogMobileVariant = 'center' | 'sheet' | 'fullscreen' | 'right-panel';
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen' | 'right-panel';

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  mobileVariant?: DialogMobileVariant;
  size?: DialogSize;
  showMobileClose?: boolean;
  closeLabel?: string;
}

const MOBILE_VARIANT_CLASSES: Record<DialogMobileVariant, string> = {
  center:
    'fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-1.5rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl',
  sheet:
    'fixed inset-x-0 bottom-0 z-50 grid w-full max-h-[88dvh] translate-y-0 rounded-t-[28px] rounded-b-none sm:left-[50%] sm:top-[50%] sm:max-h-[min(88dvh,780px)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[24px]',
  fullscreen:
    'fixed inset-0 z-50 grid h-dvh w-screen rounded-none sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[min(92dvh,920px)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px]',
  'right-panel':
    'fixed inset-x-0 bottom-0 z-50 grid w-full max-h-[88dvh] rounded-t-[28px] rounded-b-none sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:top-0 sm:h-screen sm:max-h-full sm:w-[540px] sm:rounded-none sm:rounded-l-[24px] sm:translate-x-0 sm:translate-y-0',
};

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'sm:max-w-[440px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[840px]',
  xl: 'sm:max-w-[1120px]',
  fullscreen: 'sm:max-w-[min(92vw,1200px)]',
  'right-panel': 'sm:max-w-[540px]',
};

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, mobileVariant = 'center', size, showMobileClose = false, closeLabel = 'Stang', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        MOBILE_VARIANT_CLASSES[mobileVariant],
        size ? DIALOG_SIZE_CLASSES[size] : null,
        'border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden duration-200',
        mobileVariant === 'fullscreen'
          ? 'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]'
          : mobileVariant === 'sheet'
            ? 'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:slide-in-from-bottom-8 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]'
            : mobileVariant === 'right-panel'
              ? 'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:slide-in-from-bottom-8 sm:data-[state=closed]:slide-out-to-right-full sm:data-[state=open]:slide-in-from-right-full'
              : 'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        (mobileVariant === 'sheet' || mobileVariant === 'fullscreen') && 'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
      {...props}
    >
      {showMobileClose ? (
        <DialogClose
          aria-label={closeLabel}
          className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-muted)] shadow-sm transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] sm:hidden"
        >
          <CloseIcon size={16} />
        </DialogClose>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 px-4 pt-4 text-center sm:px-6 sm:pt-6 sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse gap-2 px-4 pb-4 pt-3 sm:flex-row sm:justify-end sm:px-6 sm:pb-5', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const ModalBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6', className)} {...props} />
);
ModalBody.displayName = 'ModalBody';

const ModalSection = ({
  className,
  tone = 'plain',
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  tone?: 'plain' | 'card' | 'subtle';
}) => (
  <section
    className={cn(
      'space-y-4',
      tone === 'card' && 'rounded-[24px] border border-[var(--border)] bg-[var(--surface-0)] p-4 sm:p-5',
      tone === 'subtle' && 'rounded-[22px] border border-[var(--border-light)] bg-[var(--surface-alt)] p-4',
      className,
    )}
    {...props}
  />
);
ModalSection.displayName = 'ModalSection';

const ModalMetaCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-alt))] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
      className,
    )}
    {...props}
  />
);
ModalMetaCard.displayName = 'ModalMetaCard';

const ModalFormGrid = ({
  className,
  columns = 'two',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  columns?: 'two' | 'three' | 'sidebar';
}) => (
  <div
    className={cn(
      'grid gap-4',
      columns === 'two' && 'md:grid-cols-2',
      columns === 'three' && 'md:grid-cols-3',
      columns === 'sidebar' && 'xl:grid-cols-[minmax(0,1fr)_320px]',
      className,
    )}
    {...props}
  />
);
ModalFormGrid.displayName = 'ModalFormGrid';

const ModalActionFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogFooter
    className={cn(
      'shrink-0 border-t border-[var(--border)] bg-[var(--surface)]/96 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/88',
      className,
    )}
    {...props}
  />
);
ModalActionFooter.displayName = 'ModalActionFooter';

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-tight tracking-tight text-[var(--text-primary)]', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm leading-6 text-[var(--text-muted)]', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  ModalBody,
  ModalSection,
  ModalMetaCard,
  ModalFormGrid,
  ModalActionFooter,
  DialogTitle,
  DialogDescription,
};
