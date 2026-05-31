'use client';

import DashboardView from '../../(shell)/_components/DashboardView';
import type { DashboardReadModel } from '@modules/generic/dashboard';

const MOCK: DashboardReadModel = {
  countMap: { draft: 4, sent: 11, viewed: 7, accepted: 9 },
  total: 31,
  recentOffers: [],
  acceptedValue: 1_420_000,
  pipelineValue: 3_870_000,
  acceptanceRate: 38,
  expiringSoon: 2,
  activityData: [],
  projectStats: {
    total: 12,
    active: 5,
    completed: 7,
    stages: { details: 2, ordered: 1, arrived: 1, in_progress: 1, completed: 7 },
  },
  today: {
    dateLabel: 'Lördag 31 maj 2026',
    focusLabel: '3 offerter kräver åtgärd idag.',
    nextMeeting: {
      id: 'mtg-1',
      title: 'Säljmöte – Byggfirman AB',
      start: '2026-05-31T09:00:00+02:00',
      end: '2026-05-31T10:00:00+02:00',
      allDay: false,
      source: 'google',
    },
  },
  focusMetrics: {
    overdue: 3,
    dueSoon: 5,
    missingFollowUp: 2,
    meetingsToday: 1,
  },
  calendar: {
    configured: true,
    events: [],
    error: null,
  },
  weather: {
    status: 'ok',
    locationName: 'Stockholm',
    temperatureC: 18,
    conditionLabel: 'Delvis molnigt',
    windSpeed: 4.2,
    humidity: 62,
    symbolCode: 3,
    updatedAt: '2026-05-31T08:45:00+02:00',
    forecast: [
      { time: '2026-05-31T12:00:00+02:00', label: '12:00', temperatureC: 21, symbolCode: 2, conditionLabel: 'Klart' },
      { time: '2026-05-31T18:00:00+02:00', label: '18:00', temperatureC: 19, symbolCode: 3, conditionLabel: 'Molnigt' },
    ],
  },
  actionItems: [
    { id: '1', tone: 'danger',  label: 'Offert accepted – TechHus AB',         detail: 'Redo att starta projekt',          actionLabel: 'Redo för projekt', href: '/offerter/1' },
    { id: '2', tone: 'warning', label: 'Offert löper ut – Jansson & Co',        detail: 'Giltigheten slutar imorgon',       actionLabel: 'Förläng',          href: '/offerter/2' },
    { id: '3', tone: 'neutral', label: 'Uppföljning saknas – TechHus AB',       detail: 'Visad för 5 dagar, ingen kontakt', actionLabel: 'Följ upp',         href: '/offerter/3' },
    { id: '4', tone: 'neutral', label: 'Offert ej skickad – SolAB',             detail: 'Fortfarande i utkastläge',         actionLabel: 'Skicka offert',    href: '/offerter/4' },
  ],
  offerTable: [
    {
      id: '1', status: 'sent', statusLabel: 'Skickad', customer: 'norrtälje-bygg',
      offerNumber: 134, amount: 284_000, deadlineLabel: '12 jun', deadlineTone: 'neutral',
      nextStep: 'Väntar på svar', displayCustomerName: 'Norrtälje Bygg AB',
      displayOfferTitle: 'A-0134', displaySubtitle: '', displayAmount: '284 000 kr',
      displayRiskLabel: '', displayNextAction: 'Väntar på svar', href: '/offerter/1',
    },
    {
      id: '2', status: 'viewed', statusLabel: 'Visad', customer: 'jansson-co',
      offerNumber: 133, amount: 165_000, deadlineLabel: 'Imorgon', deadlineTone: 'warning',
      nextStep: 'Förnyas', displayCustomerName: 'Jansson & Co',
      displayOfferTitle: 'A-0133', displaySubtitle: 'Renovering kontor', displayAmount: '165 000 kr',
      displayRiskLabel: 'Utgår snart', displayNextAction: 'Förnya', href: '/offerter/2',
    },
    {
      id: '3', status: 'accepted', statusLabel: 'Accepterad', customer: 'techhus',
      offerNumber: 132, amount: 390_000, deadlineLabel: '', deadlineTone: 'neutral',
      nextStep: 'Starta projekt', displayCustomerName: 'TechHus AB',
      displayOfferTitle: 'A-0132', displaySubtitle: 'Nybyggnad lager', displayAmount: '390 000 kr',
      displayRiskLabel: '', displayNextAction: 'Starta projekt', href: '/offerter/3',
    },
    {
      id: '4', status: 'sent', statusLabel: 'Skickad', customer: 'solberga',
      offerNumber: 131, amount: 520_000, deadlineLabel: '5 jun', deadlineTone: 'neutral',
      nextStep: 'Väntar', displayCustomerName: 'Solberga Fastigheter',
      displayOfferTitle: 'A-0131', displaySubtitle: '', displayAmount: '520 000 kr',
      displayRiskLabel: '', displayNextAction: 'Väntar', href: '/offerter/4',
    },
    {
      id: '5', status: 'draft', statusLabel: 'Utkast', customer: 'solab',
      offerNumber: 130, amount: 97_000, deadlineLabel: '', deadlineTone: 'neutral',
      nextStep: 'Skicka', displayCustomerName: 'SolAB',
      displayOfferTitle: 'A-0130', displaySubtitle: '', displayAmount: '97 000 kr',
      displayRiskLabel: '', displayNextAction: 'Skicka', href: '/offerter/5',
    },
  ],
  pipelineOverview: {
    totalValue: 4_910_000,
    averageWonValue: 157_778,
    stages: [
      { id: 'draft',    label: 'Utkast',           tone: 'neutral', count: 4,  value: 410_000,   percent: 8 },
      { id: 'sent',     label: 'Offert skickad',   tone: 'accent',  count: 11, value: 1_820_000, percent: 37 },
      { id: 'viewed',   label: 'Förhandling',      tone: 'info',    count: 7,  value: 1_260_000, percent: 26 },
      { id: 'accepted', label: 'Accepterad',       tone: 'success', count: 9,  value: 1_420_000, percent: 29 },
    ],
  },
  projectHandoffs: [
    { id: '1', name: 'Nybyggnad lager – TechHus',    customer: 'TechHus AB',              stage: 'details',     stageLabel: 'Detaljering',   value: 390_000, handoffLabel: 'Klara för överlämning', href: '/projekt/1' },
    { id: '2', name: 'Kontorsrenovering Jansson',    customer: 'Jansson & Co',            stage: 'in_progress', stageLabel: 'Pågår',         value: 165_000, handoffLabel: 'Aktiva projekt',        href: '/projekt/2' },
    { id: '3', name: 'Villa Bergström',              customer: 'Anna Bergström',          stage: 'ordered',     stageLabel: 'Beställd',      value: 220_000, handoffLabel: 'Planerade projekt',     href: '/projekt/3' },
    { id: '4', name: 'Industrihall Norrköping',      customer: 'Norrköpings Industri AB', stage: 'arrived',     stageLabel: 'Anlänt',        value: 580_000, handoffLabel: 'Aktiva projekt',        href: '/projekt/4' },
    { id: '5', name: 'Garage Lindgren',              customer: 'Bo Lindgren',             stage: 'details',     stageLabel: 'Detaljering',   value: 89_000,  handoffLabel: 'Klara för överlämning', href: '/projekt/5' },
  ],
  activityFeed: [
    { id: '1', tone: 'success', label: 'Offert accepterad', detail: 'A-0132 av TechHus AB',         occurredAt: '2026-05-31T07:30:00+02:00', href: '/offerter/3' },
    { id: '2', tone: 'info',    label: 'Offert visad',      detail: 'A-0133 av Jansson & Co',        occurredAt: '2026-05-30T16:10:00+02:00', href: '/offerter/2' },
    { id: '3', tone: 'accent',  label: 'Offert skickad',    detail: 'A-0134 till Norrtälje Bygg AB', occurredAt: '2026-05-28T11:45:00+02:00', href: '/offerter/1' },
    { id: '4', tone: 'neutral', label: 'Projekt uppdaterat',detail: 'Nybyggnad lager – detaljer',    occurredAt: '2026-05-27T14:20:00+02:00', href: '/projekt/1' },
    { id: '5', tone: 'neutral', label: 'Ny offert skapad',  detail: 'A-0134 Norrtälje Bygg AB',      occurredAt: '2026-05-27T09:00:00+02:00', href: '/offerter/1' },
  ],
  kpiTrends: {
    acceptedPoints: [120_000, 0, 285_000, 0, 390_000, 165_000, 0],
    pipelinePoints: [2, 1, 3, 0, 2, 4, 1],
    winRatePoints: [30, 32, 34, 35, 37, 38, 38],
    avgDealPoints: [140_000, 145_000, 150_000, 155_000, 157_000, 158_000, 157_778],
    pipelineActiveCount: 18,
    winRateFraction: '9 av 24 vunna',
    avgDealTrendPct: 12,
  },
};

export default function DashboardPreviewPage() {
  return (
    <>
      {/* Inject the Soleria light theme variables so the preview matches production */}
      <style>{`
        :root {
          --page-bg: #f1f2fa;
          --surface: #ffffff;
          --surface-alt: #eaeaf4;
          --surface-hover: #e0e0ef;
          --surface-0: #ffffff;
          --surface-1: #f3f3fb;
          --surface-2: #eaeaf4;
          --surface-3: #e1e1ef;
          --surface-active: #d6d6ea;
          --border: #c4c4de;
          --border-light: #e1e1ef;
          --text-primary: #281a39;
          --text-secondary: #4a3860;
          --text-muted: #8878a0;
          --accent: #35aaf3;
          --accent-light: #4dbeff;
          --accent-subtle: oklch(0.68 0.16 224 / 0.08);
          --accent-border: oklch(0.68 0.16 224 / 0.22);
          --status-viewed-bg: oklch(0.960 0.04 300);
          --status-viewed-text: oklch(0.38 0.16 300);
          --status-accepted-bg: oklch(0.958 0.04 145);
          --status-accepted-text: oklch(0.35 0.16 145);
          --status-success-bg: oklch(0.958 0.04 145);
          --status-success-text: oklch(0.35 0.16 145);
          --status-warning-bg: oklch(0.960 0.04 70);
          --status-warning-text: oklch(0.40 0.16 70);
          --status-danger-bg: oklch(0.960 0.04 25);
          --status-danger-text: oklch(0.38 0.16 25);
        }
      `}</style>
      <DashboardView
        greetingText="God morgon, Malek."
        greetingSub="Lördag — kolla läget på dina offerter."
        dateLabel="Lördag 31 maj 2026"
        {...MOCK}
      />
    </>
  );
}
