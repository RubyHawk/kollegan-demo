import type { LucideIcon } from 'lucide-react';
import { Calendar, CreditCard, Link, MessageCircle, Mic, Settings } from 'lucide-react';

export interface Integration {
  name: string;
  desc: string;
  Icon: LucideIcon;
  category: string;
  connected: boolean;
  connectedLabel?: string;
}

export const INTEGRATIONS: Integration[] = [
  {
    name: 'Vapi AI',
    desc: 'Röstsamtalsplattform - hanterar inkommande och utgående AI-samtal.',
    Icon: Mic,
    category: 'Röst',
    connected: true,
    connectedLabel: 'Ansluten',
  },
  {
    name: 'n8n',
    desc: 'Arbetsflödesautomation - triggar leads, notiser och datapipelines.',
    Icon: Settings,
    category: 'Automation',
    connected: true,
    connectedLabel: 'Webhook aktiv',
  },
  {
    name: 'Google Calendar',
    desc: 'Synkronisera bokningar och möten med Google Calendar.',
    Icon: Calendar,
    category: 'Kalender',
    connected: false,
  },
  {
    name: 'Slack',
    desc: 'Skicka notiser och AI-sammanfattningar direkt till Slack.',
    Icon: MessageCircle,
    category: 'Kommunikation',
    connected: false,
  },
  {
    name: 'HubSpot',
    desc: 'Synkronisera leads och kontakter med HubSpot CRM.',
    Icon: Link,
    category: 'CRM',
    connected: false,
  },
  {
    name: 'Stripe',
    desc: 'Betalningar och fakturering för prenumerationer.',
    Icon: CreditCard,
    category: 'Betalning',
    connected: false,
  },
];
