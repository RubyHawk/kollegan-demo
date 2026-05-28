'use client';

import type { HFCtxValue } from './header-footer-context';
import { PAGE_ROLE_LABELS } from './template-doc';
import { ChoiceButton, Field, InspectorCard, ToggleCard, inputClass } from './block-settings-controls';

export function PresentationPageInspector({ hf }: { hf: HFCtxValue }) {
  const page = hf.pages[hf.activeIdx];

  return (
    <InspectorCard
      title="Sidans identitet"
      subtitle="Namn, roll och kundsynlighet."
    >
      <div className="space-y-2">
        <Field label="Sidnamn">
          <input
            type="text"
            value={page.label}
            onChange={(event) => hf.renamePage(hf.activeIdx, event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sidroll">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[12px] text-[var(--text-primary)]">
            {PAGE_ROLE_LABELS[page.role ?? 'custom']}
          </div>
        </Field>

        <ToggleCard
          title="Med i kundens PDF"
          description={page.includeInCustomerPdf === false ? 'Sidan är intern' : 'Sidan följer med kunden'}
          checked={page.includeInCustomerPdf !== false}
          onChange={(checked) => hf.patchActivePage({ includeInCustomerPdf: checked })}
        />

        {page.role === 'cover' && (
          <div className="border-l-2 border-[var(--accent)] bg-[var(--accent-subtle)] px-3 py-2 text-[12px] leading-5 text-[var(--text-secondary)]">
            Omslaget är en fri presentationssida. Lägg in titel, bild, logo och offertvariabler från vänsterpanelen och dra sedan sidan dit den ska ligga i flödet.
          </div>
        )}

        <div className="border-l-2 border-[var(--border)] px-3 py-1.5 text-[12px] leading-5 text-[var(--text-secondary)]">
          Sidtyp byts inte i efterhand. Lägg hellre till en ny offertsida eller presentationssida och ta bort den gamla om flödet ska ändras.
        </div>
      </div>
    </InspectorCard>
  );
}

export function DocumentDefaultsInspector({ hf }: { hf: HFCtxValue }) {
  const fonts = ['Calibri', 'Arial', 'Georgia', 'Helvetica Neue', 'Inter'];

  return (
    <InspectorCard
      title="Typografi & marginaler"
      subtitle="Basvärden för fria presentationssidor."
    >
      <div className="space-y-2">
        <Field label="Standardteckensnitt">
          <select
            value={hf.docSettings.defaultFont}
            onChange={(event) => hf.patchDocSettings({ defaultFont: event.target.value })}
            className={inputClass}
          >
            {fonts.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </Field>

        <Field label="Sidmarginal">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'tight', label: 'Smal' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Bred' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={hf.docSettings.pageMargin === option.value}
                onClick={() => hf.patchDocSettings({ pageMargin: option.value as 'tight' | 'normal' | 'wide' })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>
      </div>
    </InspectorCard>
  );
}

// Legacy inspector kept temporarily for reference during the new image-panel rollout.
