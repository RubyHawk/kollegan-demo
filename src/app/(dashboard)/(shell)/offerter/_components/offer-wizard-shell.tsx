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
          className="fixed inset-0 z-50 flex overflow-hidden bg-[var(--surface)]"
        >
          <div className="flex-1 flex overflow-hidden">
            <OfferWizardLivePreview {...livePreviewProps} />

            <div className="w-full lg:w-[460px] shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
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
