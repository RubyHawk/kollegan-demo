'use client';

type OfferTemplatePreviewModalProps = {
  open: boolean;
  html: string | null;
  loading: boolean;
  onClose: () => void;
};

export function OfferTemplatePreviewModal({
  open,
  html,
  loading,
  onClose,
}: OfferTemplatePreviewModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] shadow-[0_32px_90px_rgba(0,0,0,0.34)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-alt)] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Mallpreview
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
              Förhandsvisning av mall
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Kontrollera strukturen innan du väljer mallen för offerten.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(236,240,248,0.9)_48%,_rgba(226,232,240,0.88)_100%)] p-6">
          <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/70 bg-white/55 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]/35" />
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]/18" />
              </div>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium">
                Kundvy
              </span>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              {loading ? (
                <div className="flex h-64 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-spin text-[var(--accent)]"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Laddar förhandsvisning…
                </div>
              ) : (
                <iframe
                  srcDoc={html ?? ''}
                  title="Mallförhandsvisning"
                  className="min-h-[72vh] w-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
