'use client';

import type { HFCtxValue } from './header-footer-context';
import { PAGE_ROLE_LABELS } from './template-doc';
import { ChoiceButton, Field, InspectorCard, ModernSelect, SegmentedControl, ToggleCard, inputClass } from './block-settings-controls';

export function PresentationPageInspector({ hf }: { hf: HFCtxValue }) {
  const page = hf.pages[hf.activeIdx];

  return (
    <InspectorCard
      title="Sidans identitet"
      subtitle="Namn, roll och kundsynlighet."
    >
      <div className="space-y-1.5">
        <Field label="Sidnamn">
          <input
            type="text"
            value={page.label}
            onChange={(event) => hf.renamePage(hf.activeIdx, event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sidroll">
          <div className="rounded-lg bg-[var(--ui-surface-hover)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ui-text)]">
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
          <div className="border-l-2 border-[var(--ui-accent)] bg-[var(--ui-surface-selected)] px-3 py-1.5 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
            Omslaget är en fri presentationssida. Lägg in titel, bild, logo och offertvariabler från vänsterpanelen och dra sedan sidan dit den ska ligga i flödet.
          </div>
        )}

        <div className="border-l-2 border-[var(--ui-border)] px-3 py-1 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
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
      <div className="space-y-1.5">
        <Field label="Standardteckensnitt">
          <ModernSelect
            value={hf.docSettings.defaultFont}
            onChange={(value) => hf.patchDocSettings({ defaultFont: value })}
            options={fonts.map((font) => ({ value: font, label: font }))}
            title="Standardteckensnitt"
          />
        </Field>

        <Field label="Sidmarginal">
          <SegmentedControl columns={3}>
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
          </SegmentedControl>
        </Field>
      </div>
    </InspectorCard>
  );
}

// Legacy inspector kept temporarily for reference during the new image-panel rollout.
