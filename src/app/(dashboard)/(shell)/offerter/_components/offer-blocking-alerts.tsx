import { TriangleAlert, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';

export type BlockingErrorPayload = {
  code?: string;
  field?: string;
  message?: string;
};

type BlockingAlertGroup = {
  title: string;
  description: string;
  items: string[];
};

export type BlockingAlert = {
  title: string;
  summary: string;
  groups: BlockingAlertGroup[];
  footer: string;
};

function describeBlockingIssue(issue: BlockingErrorPayload): { key: string; text: string } {
  const field = issue.field ?? '';
  const rowMatch = field.match(/lineItems\[(\d+)\]\.description/);
  const rowNumber = rowMatch ? Number(rowMatch[1]) + 1 : null;

  switch (issue.code) {
    case 'line_item.placeholder_description':
      return {
        key: 'products',
        text: rowNumber
          ? `Rad ${rowNumber} behöver en riktig produktbeskrivning. Ersätt mallens hjälptext med vad kunden faktiskt köper.`
          : 'Minst en produktrad använder fortfarande mallens hjälptext. Ersätt den med en riktig produktbeskrivning.',
      };
    case 'template.placeholder_intro':
      return {
        key: 'intro',
        text: 'Introduktionen på offertsidan använder fortfarande mallens hjälptext. Skriv en riktig introduktion eller ta bort blocket.',
      };
    case 'template.placeholder_terms':
      return {
        key: 'terms',
        text: 'Villkorsblocket använder fortfarande mallens standardtext. Skriv riktiga kommersiella villkor för den här offerten.',
      };
    case 'template.missing_terms':
      return {
        key: 'terms',
        text: 'Offerten saknar aktiva kommersiella villkor. Lägg till villkor eller skriv uttryckligen vad som inte specificeras.',
      };
    case 'sender.demo_org_number':
      return {
        key: 'sender',
        text: 'Avsändarens organisationsnummer ser fortfarande ut som demo- eller testdata. Uppdatera företagsprofilen med rätt organisationsnummer.',
      };
    case 'sender.demo_address':
      return {
        key: 'sender',
        text: 'Avsändaradressen ser fortfarande ut som demo- eller testdata. Uppdatera företagsprofilen med rätt adress.',
      };
    default:
      return {
        key: 'other',
        text: issue.message?.trim() || 'Offerten innehåller blockerande uppgifter som måste rättas innan den kan skickas.',
      };
  }
}

export function buildBlockingAlert(issues: BlockingErrorPayload[]): BlockingAlert {
  const groupOrder = ['products', 'sender', 'intro', 'terms', 'other'] as const;
  const groupMeta: Record<(typeof groupOrder)[number], { title: string; description: string }> = {
    products: {
      title: 'Produkter och tjänster',
      description: 'Några produktrader innehåller fortfarande malltext i stället för riktig offertinformation.',
    },
    sender: {
      title: 'Företagsuppgifter',
      description: 'Avsändarens profil innehåller fortfarande demo- eller testuppgifter.',
    },
    intro: {
      title: 'Introduktion',
      description: 'Överst på offertsidan ligger fortfarande mallens hjälptext kvar.',
    },
    terms: {
      title: 'Villkor',
      description: 'Juridik- eller villkorsdelen behöver ersättas med riktiga kommersiella villkor.',
    },
    other: {
      title: 'Övrigt',
      description: 'Det finns fler blockerande kvalitetsproblem som måste rättas innan skickning.',
    },
  };

  const grouped = new Map<string, string[]>();
  issues.forEach((issue) => {
    const { key, text } = describeBlockingIssue(issue);
    const current = grouped.get(key) ?? [];
    if (!current.includes(text)) current.push(text);
    grouped.set(key, current);
  });

  const groups = groupOrder
    .filter((key) => grouped.has(key))
    .map((key) => ({
      title: groupMeta[key].title,
      description: groupMeta[key].description,
      items: grouped.get(key) ?? [],
    }));

  return {
    title: 'Offerten kan inte skickas ännu',
    summary: 'Skickningen stoppades eftersom offerten fortfarande innehåller malltext eller demo-/testuppgifter som riskerar att följa med till kunden.',
    groups,
    footer: 'Rätta punkterna nedan och försök igen. Det här skyddet finns för att undvika att kunder får hjälptext, standardvillkor eller testdata i en skarp offert.',
  };
}

export function BlockingAlertCard({
  alert,
  onDismiss,
  compact = false,
}: {
  alert: BlockingAlert;
  onDismiss: () => void;
  compact?: boolean;
}) {
  return (
    <Panel variant="warning" padding={compact ? 'sm' : 'lg'}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]">
            <TriangleAlert size={18} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-[var(--ui-warning-text)]">Kvalitetskontroll</p>
            <h3 className={cn('mt-1 font-semibold text-[var(--ui-warning-text)]', compact ? 'text-sm' : 'text-base')}>
              {alert.title}
            </h3>
            <p className={cn('mt-1 max-w-4xl text-[var(--ui-warning-text)]', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
              {alert.summary}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="size-8 shrink-0 text-[var(--ui-warning-text)]"
          aria-label="Stäng varning"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </Button>
      </div>

      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-1' : 'md:grid-cols-2')}>
        {alert.groups.map((group) => (
          <section key={group.title} className="rounded-[var(--ui-radius-md)] border border-[var(--ui-warning-border)] bg-[var(--ui-surface-raised)] px-4 py-3">
            <h4 className="text-sm font-semibold text-[var(--ui-warning-text)]">{group.title}</h4>
            <p className="mt-1 text-xs leading-5 text-[var(--ui-warning-text)]">{group.description}</p>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-[var(--ui-warning-text)]">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-warning-text)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className={cn('mt-4 rounded-[var(--ui-radius-md)] border border-[var(--ui-warning-border)] bg-[var(--ui-surface-raised)] px-4 py-3 text-[var(--ui-warning-text)]', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
        {alert.footer}
      </p>
    </Panel>
  );
}

export function GenericErrorBanner({ message, onDismiss, compact = false }: { message: string; onDismiss: () => void; compact?: boolean }) {
  return (
    <Panel
      variant="danger"
      padding="sm"
      className={cn('flex items-center justify-between gap-3', compact ? 'text-xs' : 'text-sm')}
    >
      <span>{message}</span>
      <Button type="button" variant="ghost" size="icon" onClick={onDismiss} className="size-8 shrink-0 text-[var(--ui-danger-text)]" aria-label="Stäng felmeddelande">
        <X size={compact ? 12 : 14} strokeWidth={1.75} aria-hidden />
      </Button>
    </Panel>
  );
}
