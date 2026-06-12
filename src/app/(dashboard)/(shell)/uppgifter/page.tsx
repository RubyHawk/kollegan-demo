import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';

export default function TasksPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Uppgifter"
        description="Checklistor är förberedda i datamodellen och kan aktiveras som nästa praktiska driftmodul."
      />
      <Panel>
        <p className="text-sm text-[var(--ui-text-muted)]">Nästa steg: öppningslista, stängningslista, köksuppgifter och ansvar per pass.</p>
      </Panel>
    </div>
  );
}
