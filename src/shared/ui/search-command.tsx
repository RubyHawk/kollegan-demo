'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchIcon } from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';
import { SETTINGS_CONFIG, getVisibleSettings } from '@shared/nav/settings-config';
import { listCustomers } from '@shared/lib/api/customers.api';
import { listLeads } from '@shared/lib/api/leads.api';
import { listOffers } from '@shared/lib/api/offers.api';
import { listProducts } from '@shared/lib/api/products.api';
import { listProjects } from '@shared/lib/api/projects.api';
import { listTemplates } from '@shared/lib/api/templates.api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';

interface CommandItem {
  href: string;
  label: string;
  description: string;
  keywords: string[];
  category: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  { href: '/', label: 'Översikt', description: 'Se läget i dashboarden', keywords: ['dashboard', 'start', 'oversikt'], category: 'Sida' },
  { href: '/offerter', label: 'Offerter', description: 'Bläddra bland alla offerter', keywords: ['offerter', 'lista', 'quotes'], category: 'Sida' },
  { href: '/offerter/ny', label: 'Ny offert', description: 'Skapa en ny offert direkt', keywords: ['ny', 'offert', 'create'], category: 'Sida' },
  { href: '/projekt', label: 'Projekt', description: 'Följ projekt från accepterad offert till klart jobb', keywords: ['projekt', 'installation', 'project'], category: 'Sida' },
  { href: '/crm', label: 'CRM', description: 'Kunder, kontakter och leads', keywords: ['crm', 'kund', 'kontakt', 'lead'], category: 'Sida' },
  { href: '/crm/contacts', label: 'Kontakter', description: 'Sök och uppdatera kundkontakter', keywords: ['kontakt', 'kund', 'customer'], category: 'Sida' },
  { href: '/crm/leads', label: 'Leads', description: 'Hantera inkommande leads', keywords: ['lead', 'pipeline'], category: 'Sida' },
  { href: '/mallar', label: 'Mallar', description: 'Hantera offermallar och innehåll', keywords: ['mallar', 'templates'], category: 'Sida' },
  { href: '/produkter', label: 'Produkter', description: 'Uppdatera produkter och tjänster', keywords: ['produkter', 'services', 'produktbibliotek'], category: 'Sida' },
  { href: '/reports', label: 'Rapporter', description: 'Exportera rapporter och CSV-underlag', keywords: ['rapporter', 'export', 'csv'], category: 'Sida' },
];

// Settings routes are derived from SETTINGS_CONFIG so the palette always matches
// the settings rail — including role visibility (no dead-end results).
function buildSettingsCommands(userRole?: string): CommandItem[] {
  const sections = userRole ? getVisibleSettings(userRole) : SETTINGS_CONFIG;
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description,
      keywords: [item.href.split('/').filter(Boolean).at(-1)!, 'installningar', 'settings', section.label.toLowerCase()],
      category: 'Inställningar',
    })),
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired: 'Utgången',
  new: 'Ny',
  contacted: 'Kontaktad',
  qualified: 'Kvalificerad',
  proposal: 'Offert',
  won: 'Vunnen',
  lost: 'Förlorad',
  details: 'Uppgifter',
  ordered: 'Beställt',
  arrived: 'Ankommet',
  in_progress: 'Pågår',
  completed: 'Klart',
};

function compactSEK(value: number | null | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

function includesQuery(item: CommandItem, normalized: string) {
  const haystack = [
    item.label,
    item.description,
    item.href,
    item.category,
    ...item.keywords,
  ].join(' ').toLowerCase();

  return haystack.includes(normalized);
}

export function SearchTrigger({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const allCommands = useMemo(() => [...COMMAND_ITEMS, ...buildSettingsCommands(userRole)], [userRole]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entityResults, setEntityResults] = useState<CommandItem[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityError, setEntityError] = useState<string | null>(null);
  const isMac =
    typeof navigator !== 'undefined' &&
    (navigator.platform?.toLowerCase().includes('mac') ||
      navigator.userAgent?.toLowerCase().includes('mac'));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (!open || normalized.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setEntityLoading(true);
      setEntityError(null);

      const [
        offersResult,
        contactsResult,
        leadsResult,
        projectsResult,
        productsResult,
        templatesResult,
      ] = await Promise.allSettled([
        listOffers({ search: normalized, limit: 5, offset: 0 }),
        listCustomers({ search: normalized, limit: 5, offset: 0 }),
        listLeads({ search: normalized, limit: 5, offset: 0 }),
        listProjects({ search: normalized, limit: 5, offset: 0 }),
        listProducts({ search: normalized, isActive: true }),
        listTemplates(),
      ]);

      if (cancelled) return;

      const next: CommandItem[] = [];
      const failed = [
        offersResult,
        contactsResult,
        leadsResult,
        projectsResult,
        productsResult,
        templatesResult,
      ].some((result) => result.status === 'rejected');

      if (offersResult.status === 'fulfilled') {
        for (const offer of offersResult.value.offers.slice(0, 5)) {
          const number = offer.offerNumber ? `#${offer.offerNumber}` : offer.id.slice(0, 8).toUpperCase();
          const amount = compactSEK(offer.totalIncVat);
          next.push({
            href: `/offerter/${offer.id}`,
            label: `${offer.title || 'Offert'} ${number}`,
            description: [STATUS_LABEL[offer.status] ?? offer.status, offer.recipientName, amount].filter(Boolean).join(' · '),
            keywords: ['offert', offer.recipientEmail, offer.recipientCompany ?? '', number],
            category: 'Offert',
          });
        }
      }

      if (contactsResult.status === 'fulfilled') {
        for (const contact of contactsResult.value.contacts.slice(0, 5)) {
          const title = contact.name ?? contact.email ?? 'Kontakt';
          next.push({
            href: `/crm/contacts?search=${encodeURIComponent(title)}`,
            label: title,
            description: [contact.company, contact.email, contact.phone].filter(Boolean).join(' · ') || 'Kundkontakt',
            keywords: ['kontakt', 'kund', contact.company ?? '', contact.email ?? '', contact.phone ?? ''],
            category: 'Kontakt',
          });
        }
      }

      if (leadsResult.status === 'fulfilled') {
        for (const lead of leadsResult.value.leads.slice(0, 5)) {
          const amount = compactSEK(lead.estimatedValue);
          next.push({
            href: `/crm/leads?search=${encodeURIComponent(lead.name)}`,
            label: lead.name,
            description: [STATUS_LABEL[lead.status] ?? lead.status, lead.company, amount].filter(Boolean).join(' · ') || 'Lead',
            keywords: ['lead', lead.email ?? '', lead.phone ?? '', lead.company ?? ''],
            category: 'Lead',
          });
        }
      }

      if (projectsResult.status === 'fulfilled') {
        for (const project of projectsResult.value.projects.slice(0, 5)) {
          const amount = compactSEK(project.totalIncVat);
          next.push({
            href: `/projekt/${project.id}`,
            label: project.name,
            description: [STATUS_LABEL[project.stage] ?? project.stage, project.customer?.company ?? project.customer?.name, amount].filter(Boolean).join(' · '),
            keywords: ['projekt', project.customer?.email ?? '', project.customer?.phone ?? '', project.offerNumber ? String(project.offerNumber) : ''],
            category: 'Projekt',
          });
        }
      }

      if (productsResult.status === 'fulfilled') {
        for (const product of productsResult.value.slice(0, 5)) {
          const amount = compactSEK(product.unitPrice);
          next.push({
            href: `/produkter?search=${encodeURIComponent(product.name)}`,
            label: product.name,
            description: [product.category, amount, product.unit].filter(Boolean).join(' · ') || 'Produkt',
            keywords: ['produkt', product.sku ?? '', product.description ?? '', product.category ?? ''],
            category: 'Produkt',
          });
        }
      }

      if (templatesResult.status === 'fulfilled') {
        const templates = templatesResult.value.filter((template) => {
          const haystack = [template.name, template.emailSubject, template.emailBody]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalized);
        });

        for (const template of templates.slice(0, 5)) {
          next.push({
            href: `/mallar/${template.id}`,
            label: template.name,
            description: template.emailSubject || 'Offertmall',
            keywords: ['mall', 'template', template.emailSubject ?? ''],
            category: 'Mall',
          });
        }
      }

      setEntityResults(next.slice(0, 12));
      setEntityError(failed ? 'Några sökkällor svarade inte.' : null);
      setEntityLoading(false);
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allCommands;

    const pageMatches = allCommands.filter((item) => includesQuery(item, normalized));
    return normalized.length >= 2
      ? [...entityResults, ...pageMatches].slice(0, 18)
      : pageMatches;
  }, [allCommands, entityResults, query]);

  function openRoute(href: string) {
    setOpen(false);
    setQuery('');
    if (href !== pathname) router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 min-w-[280px] items-center gap-2 rounded-md px-3',
          'border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm',
          'text-sm text-[var(--ui-text-muted)]',
          'hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
        )}
        aria-label="Öppna snabbnavigering"
      >
        <SearchIcon size={16} />
        <span className="hidden flex-1 text-left text-[13px] sm:inline">Sök kund, offert, projekt...</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)] sm:inline-flex">
          {isMac ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery('');
        }}
      >
        <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-xl p-0">
          <DialogHeader className="border-b border-[var(--ui-border)] px-5 pb-3 pt-5">
            <DialogTitle className="text-base text-[var(--ui-text)]">Snabbsök</DialogTitle>
            <DialogDescription>
              Hitta sidor, offerter, kunder, leads, projekt, produkter och mallar.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-[var(--ui-border)] px-5 py-4">
            <div className="flex items-center gap-3 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3">
              <SearchIcon size={16} className="text-[var(--ui-text-muted)]" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && matches[0]) {
                    event.preventDefault();
                    openRoute(matches[0].href);
                  }
                }}
                placeholder="Sök på offert, kund, projekt, produkt eller mall..."
                className="h-11 w-full border-0 bg-transparent p-0 text-sm text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-text-muted)]"
              />
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {matches.length > 0 ? (
              matches.map((item) => {
                const active = pathname === item.href;

                return (
                  <button
                    key={`${item.category}:${item.href}:${item.label}`}
                    type="button"
                    onClick={() => openRoute(item.href)}
                    className={cn(
                      'flex w-full items-start justify-between gap-4 rounded-md px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
                      active
                        ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-text)]'
                        : 'hover:bg-[var(--ui-surface-hover)]',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="mb-1 inline-flex rounded-sm bg-[var(--ui-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">
                        {item.category}
                      </span>
                      <span className="block truncate text-sm font-medium text-[var(--ui-text)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--ui-text-secondary)]">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-sm border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1 text-[11px] text-[var(--ui-text-muted)]">
                      {active ? 'Nuvarande' : item.href}
                    </span>
                  </button>
                );
              })
            ) : entityLoading ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium text-[var(--ui-text)]">Söker...</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  Letar bland offerter, kunder, projekt, produkter och mallar.
                </p>
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium text-[var(--ui-text)]">Inga träffar ännu</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  Prova att söka på offert, kund, projekt, produkt eller mall.
                </p>
                {entityError && (
                  <p className="mt-2 text-xs text-[var(--ui-danger-text)]">{entityError}</p>
                )}
              </div>
            )}
            {entityLoading && query.trim().length >= 2 && matches.length > 0 && (
              <div className="px-3 py-2 text-center text-xs text-[var(--ui-text-muted)]">Uppdaterar sökresultat...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
