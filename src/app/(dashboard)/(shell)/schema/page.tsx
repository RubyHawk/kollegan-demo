import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';

export default function SchedulePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Schema"
        description="Schemaläggning är förberedd i datamodellen och byggs ut efter klock-in-MVP:t."
      />
      <Panel>
        <p className="text-sm text-[var(--ui-text-muted)]">Nästa steg: skapa, ändra och publicera arbetspass per medarbetare.</p>
      </Panel>
    </div>
  );
}
