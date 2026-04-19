'use client';

import { CalendarIcon } from '@shared/ui/icons';

export function PublicOfferFooter({
  validUntilLabel,
  recipientEmail,
}: {
  validUntilLabel: string;
  recipientEmail?: string | null;
}) {
  return (
    <>
      <div className="mt-4 flex items-center justify-center gap-1.5 px-4 sm:hidden">
        <CalendarIcon size={11} className="text-slate-500" />
        <p className="text-[12px] text-slate-600">Giltig till {validUntilLabel}</p>
      </div>

      <p className="mt-6 px-4 text-center text-[12px] text-slate-500">
        Soleria offertportal · {recipientEmail}
      </p>
    </>
  );
}
