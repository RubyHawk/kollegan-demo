'use client';

import type { ComponentProps, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OfferWizardLivePreview } from './offer-wizard-live-preview';
import { OfferWizardStepOne } from './offer-wizard-step-one';
import { OfferWizardStepTwoPanel } from './offer-wizard-step-two-panel';

type OfferWizardShellProps = {
  open: boolean;
  wizardStep: 1 | 2;
  livePreviewProps: ComponentProps<typeof OfferWizardLivePreview>;
  stepOneProps: ComponentProps<typeof OfferWizardStepOne>;
  stepTwoProps: ComponentProps<typeof OfferWizardStepTwoPanel>;
  notice?: ReactNode;
};

export function OfferWizardShell({
  open,
  wizardStep,
  livePreviewProps,
  stepOneProps,
  stepTwoProps,
  notice,
}: OfferWizardShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="offer-wizard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex overflow-hidden bg-[var(--ui-surface)]"
        >
          <div className="flex flex-1 overflow-hidden">
            <OfferWizardLivePreview {...livePreviewProps} />

            <div className="flex w-full shrink-0 flex-col overflow-hidden border-l border-[var(--ui-border)] bg-[var(--ui-surface)] lg:w-[460px]">
              {notice}
              {wizardStep === 1 && <OfferWizardStepOne {...stepOneProps} />}
              {wizardStep === 2 && <OfferWizardStepTwoPanel {...stepTwoProps} />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
