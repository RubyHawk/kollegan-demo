export const ACTIVE_NOTIFICATION_TAGS = [
  'offer_signed',
  'offer_declined',
] as const;

export const PLANNED_NOTIFICATION_TAGS = [
  'offer_sent',
  'offer_viewed',
  'offer_expiring',
  'lead_assigned',
  'meeting_booked',
  'invoice_due',
  'invoice_paid',
] as const;

export type ActiveNotificationTag = typeof ACTIVE_NOTIFICATION_TAGS[number];
export type PlannedNotificationTag = typeof PLANNED_NOTIFICATION_TAGS[number];
export type NotificationTag = ActiveNotificationTag | PlannedNotificationTag;

export const NOTIFICATION_TAG_SCOPES = [
  'offerter',
  'crm',
  'kalender',
  'ekonomi',
] as const;

export type NotificationTagScope = typeof NOTIFICATION_TAG_SCOPES[number];

export interface NotificationTagDefinition {
  tag: NotificationTag;
  label: string;
  description: string;
  scope: NotificationTagScope;
  availability: 'active' | 'planned';
  tone: 'emerald' | 'red' | 'blue' | 'amber' | 'violet';
}

export interface ActiveNotificationTagDefinition extends NotificationTagDefinition {
  tag: ActiveNotificationTag;
  availability: 'active';
}

export interface PlannedNotificationTagDefinition extends NotificationTagDefinition {
  tag: PlannedNotificationTag;
  availability: 'planned';
}

export interface NotificationRecipient {
  id: string;
  email: string;
  tags: ActiveNotificationTag[];
}

export const NOTIFICATION_SCOPE_LABELS: Record<NotificationTagScope, string> = {
  offerter: 'Offerter',
  crm: 'CRM',
  kalender: 'Kalender',
  ekonomi: 'Ekonomi',
};

export const NOTIFICATION_SCOPE_DESCRIPTIONS: Record<NotificationTagScope, string> = {
  offerter: 'Utskicks- och signeringshändelser i offertflödet.',
  crm: 'Kunddialog och leadansvar när CRM-funktioner byggs ut.',
  kalender: 'Bokningar, bekräftelser och framtida tidshändelser.',
  ekonomi: 'Fakturor, betalningar och andra ekonomiska notiser.',
};

export const NOTIFICATION_TAG_REGISTRY: Record<NotificationTag, NotificationTagDefinition> = {
  offer_signed: {
    tag: 'offer_signed',
    label: 'Offert signerad',
    description: 'När en kund accepterar och signerar en offert.',
    scope: 'offerter',
    availability: 'active',
    tone: 'emerald',
  },
  offer_declined: {
    tag: 'offer_declined',
    label: 'Offert avvisad',
    description: 'När en kund tackar nej eller avvisar en offert.',
    scope: 'offerter',
    availability: 'active',
    tone: 'red',
  },
  offer_sent: {
    tag: 'offer_sent',
    label: 'Offert skickad',
    description: 'När en offert skickas ut till mottagaren.',
    scope: 'offerter',
    availability: 'planned',
    tone: 'blue',
  },
  offer_viewed: {
    tag: 'offer_viewed',
    label: 'Offert visad',
    description: 'När mottagaren öppnar den publika offerten.',
    scope: 'offerter',
    availability: 'planned',
    tone: 'blue',
  },
  offer_expiring: {
    tag: 'offer_expiring',
    label: 'Offert utgår snart',
    description: 'När en offert närmar sig sitt sista giltighetsdatum.',
    scope: 'offerter',
    availability: 'planned',
    tone: 'amber',
  },
  lead_assigned: {
    tag: 'lead_assigned',
    label: 'Lead tilldelad',
    description: 'När ett nytt lead tilldelas en ansvarig användare.',
    scope: 'crm',
    availability: 'planned',
    tone: 'violet',
  },
  meeting_booked: {
    tag: 'meeting_booked',
    label: 'Möte bokat',
    description: 'När ett nytt möte bokas eller bekräftas.',
    scope: 'kalender',
    availability: 'planned',
    tone: 'blue',
  },
  invoice_due: {
    tag: 'invoice_due',
    label: 'Faktura förfaller',
    description: 'När en faktura närmar sig förfallodatum.',
    scope: 'ekonomi',
    availability: 'planned',
    tone: 'amber',
  },
  invoice_paid: {
    tag: 'invoice_paid',
    label: 'Faktura betald',
    description: 'När en kundbetalning registreras och stängs.',
    scope: 'ekonomi',
    availability: 'planned',
    tone: 'emerald',
  },
};

export const ACTIVE_NOTIFICATION_DEFINITIONS: ActiveNotificationTagDefinition[] = ACTIVE_NOTIFICATION_TAGS.map(
  (tag) => NOTIFICATION_TAG_REGISTRY[tag] as ActiveNotificationTagDefinition,
);

export const PLANNED_NOTIFICATION_DEFINITIONS: PlannedNotificationTagDefinition[] = PLANNED_NOTIFICATION_TAGS.map(
  (tag) => NOTIFICATION_TAG_REGISTRY[tag] as PlannedNotificationTagDefinition,
);

export function isActiveNotificationTag(tag: string): tag is ActiveNotificationTag {
  return (ACTIVE_NOTIFICATION_TAGS as readonly string[]).includes(tag);
}

export function getNotificationTagsForScope(scope: NotificationTagScope): NotificationTagDefinition[] {
  return Object.values(NOTIFICATION_TAG_REGISTRY).filter((definition) => definition.scope === scope);
}
