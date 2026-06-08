import type { LucideIcon } from 'lucide-react';
import { BriefcaseBusiness, FileText, FolderGit2, MessageSquare, Workflow } from 'lucide-react';

export interface Connection {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  badge?: string;
}

export const CONNECTIONS: Connection[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Synka repositories, issues och pull requests direkt i Soleria.',
    Icon: FolderGit2,
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Importera kalender, kontakter och Drive-filer.',
    badge: 'Populär',
    Icon: BriefcaseBusiness,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Skicka notiser och uppdateringar till dina Slack-kanaler.',
    Icon: MessageSquare,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Exportera rapporter och data direkt till Notion-sidor.',
    Icon: FileText,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automatisera arbetsflöden med tusentals andra appar.',
    Icon: Workflow,
  },
];
