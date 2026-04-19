import { cn } from '@shared/lib/utils';

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
          ? `Rad ${rowNumber} behöver en riktig produktbeskrivning. Ersätt mallens hjälpteext med vad kunden faktiskt köper.`
          : 'Minst en produktrad använder fortfarande mallens hjälpteext. Ersätt den med en riktig produktbeskrivning.',
      };
    case 'template.placeholder_intro':
      return {
        key: 'intro',
        text: 'Introduktionen på offertsidan använder fortfarande mallens hjälpteext. Skriv en riktig introduktion eller ta bort blocket.',
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
      description: 'Överst på offertsidan ligger fortfarande mallens hjälpteext kvar.',
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
    footer: 'Rätta punkterna nedan och försök igen. Det här skyddet finns för att undvika att kunder får hjälpteext, standardvillkor eller testdata i en skarp offert.',
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
    <div className={cn(
      'rounded-2xl border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,237,0.96))] text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.10)]',
      compact ? 'px-3 py-3' : 'px-5 py-4',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="m3.2 18 7.9-13.7a1 1 0 0 1 1.8 0L20.8 18a1 1 0 0 1-.9 1.5H4.1a1 1 0 0 1-.9-1.5Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700/80">
              Kvalitetskontroll
            </p>
            <h3 className={cn('mt-1 font-semibold text-amber-950', compact ? 'text-sm' : 'text-base')}>
              {alert.title}
            </h3>
            <p className={cn('mt-1 max-w-4xl text-amber-900/85', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
              {alert.summary}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="shrink-0 rounded-full p-1 text-amber-700/70 transition hover:bg-amber-500/10 hover:text-amber-900" aria-label="Stäng varning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-1' : 'md:grid-cols-2')}>
        {alert.groups.map((group) => (
          <section key={group.title} className="rounded-xl border border-amber-200/80 bg-white/70 px-4 py-3">
            <h4 className="text-sm font-semibold text-amber-950">{group.title}</h4>
            <p className="mt-1 text-xs leading-5 text-amber-900/75">{group.description}</p>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-amber-950">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className={cn('mt-4 rounded-xl border border-amber-200/80 bg-white/55 px-4 py-3 text-amber-900/85', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
        {alert.footer}
      </p>
    </div>
  );
}

export function GenericErrorBanner({ message, onDismiss, compact = false }: { message: string; onDismiss: () => void; compact?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700',
      compact ? 'text-xs' : 'text-sm',
      'flex items-center justify-between gap-3',
    )}>
      <span>{message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <svg width={compact ? '12' : '14'} height={compact ? '12' : '14'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
