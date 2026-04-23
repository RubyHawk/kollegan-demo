'use client';

import type { HFCtxValue } from './header-footer-context';
import { PAGE_ROLE_LABELS } from './template-doc';
import { ChoiceButton, Field, InspectorCard, ToggleCard, inputClass } from './block-settings-controls';

export function PresentationPageInspector({ hf }: { hf: HFCtxValue }) {
  const page = hf.pages[hf.activeIdx];

  return (
    <InspectorCard
      title="Sida"
      subtitle="Grundinställningar för presentationssidan."
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

        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            active={(page.kind ?? 'presentation') === 'presentation'}
            onClick={() => hf.patchActivePage({ kind: 'presentation', role: page.role ?? 'custom' })}
          >
            Presentation
          </ChoiceButton>
          <ChoiceButton
            active={(page.kind ?? 'presentation') === 'document'}
            onClick={() => hf.patchActivePage({ kind: 'document', role: 'offer', includeInCustomerPdf: true })}
          >
            Gör till offertsida
          </ChoiceButton>
        </div>
      </div>
    </InspectorCard>
  );
}

export function DocumentDefaultsInspector({ hf }: { hf: HFCtxValue }) {
  const fonts = ['Calibri', 'Arial', 'Georgia', 'Helvetica Neue', 'Inter'];

  return (
    <InspectorCard
      title="Dokumentstandard"
      subtitle="Typsnitt och marginaler för presentationssidorna."
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
