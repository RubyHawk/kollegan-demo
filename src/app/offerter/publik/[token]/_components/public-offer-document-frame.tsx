'use client';

import { motion } from 'framer-motion';
import type { Ref } from 'react';

export function PublicOfferDocumentFrame({
  sectionRef,
  iframeRef,
  srcDoc,
  hasPromoPages,
  onLoad,
}: {
  sectionRef: Ref<HTMLElement>;
  iframeRef: Ref<HTMLIFrameElement>;
  srcDoc: string;
  hasPromoPages: boolean;
  onLoad: () => void;
}) {
  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04 }}
      className={hasPromoPages
        ? 'mb-6 overflow-visible bg-transparent shadow-none sm:rounded-[26px]'
        : 'mb-6 overflow-visible bg-transparent shadow-none sm:mx-0 sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-white/75 sm:bg-white/92 sm:shadow-[0_20px_42px_rgba(15,23,42,0.08)]'}
    >
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        title="Offertdokument"
        onLoad={onLoad}
        className="block w-full border-none"
        style={{ minHeight: '200px', overflow: 'hidden' }}
        scrolling="no"
      />
    </motion.section>
  );
}

export function PublicOfferDocumentLoadingNotice() {
  return (
    <div className="mb-4 flex items-center justify-center rounded-[20px] border border-slate-200/70 bg-white/95 px-4 py-3 text-sm text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur">
      Anpassar offerten för din skärm...
    </div>
  );
}
