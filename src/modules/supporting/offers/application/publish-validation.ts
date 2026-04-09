import { ApiError, type Problem } from '@platform/api/errors';
import type { Company, Offer } from '../domain/offer.entity';
import type { OfferBrandingProfile } from './company-branding';

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

type ParsedOfferTemplate = {
  pages?: Array<{
    kind?: 'presentation' | 'document';
    role?: 'offer' | string;
    body?: TipTapNode;
    document?: {
      showIntro?: boolean;
      showTerms?: boolean;
      termsBody?: string;
    };
  }>;
};

export interface OfferPublishBlockingIssue {
  code: string;
  field: string;
  message: string;
}

type OfferPublishBlockedProblem = Omit<Problem, 'timestamp' | 'requestId' | 'instance'> & {
  blockingErrors: OfferPublishBlockingIssue[];
};

interface PublishValidationInput {
  offer: Offer;
  branding: OfferBrandingProfile;
  generatedDocument: string;
  templateContent?: string;
  company?: Company | null;
}

const DEFAULT_INTRO_PLACEHOLDER =
  'Här kan du skriva en kort introduktion eller extra förtydligande till offerten.';
const DEFAULT_PRODUCT_DESCRIPTION_PLACEHOLDER =
  'Beskrivningen hjälper säljaren förstå vad som faktiskt ska läggas till i offerten.';
const DEFAULT_TERMS_PLACEHOLDER =
  'Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.';
const KNOWN_DEMO_ORG_NUMBERS = new Set(['556677-8899', '521523-5454']);

function normalizeValue(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('sv-SE');
}

function collectText(node: TipTapNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(collectText).join(' ');
}

function getOfferTemplatePage(templateContent?: string) {
  if (!templateContent) return null;

  try {
    const parsed = JSON.parse(templateContent) as ParsedOfferTemplate;
    return parsed.pages?.find((page) => page.kind === 'document' || page.role === 'offer') ?? null;
  } catch {
    return null;
  }
}

function pushIssue(
  issues: OfferPublishBlockingIssue[],
  issue: OfferPublishBlockingIssue,
): void {
  const exists = issues.some((current) => current.code === issue.code && current.field === issue.field);
  if (!exists) issues.push(issue);
}

function validatePlaceholderContent(
  issues: OfferPublishBlockingIssue[],
  input: PublishValidationInput,
): void {
  const offerPage = getOfferTemplatePage(input.templateContent);
  const introText = normalizeValue(offerPage ? collectText(offerPage.body) : input.generatedDocument);
  const termsBody = normalizeValue(offerPage?.document?.termsBody);

  if ((offerPage?.document?.showIntro ?? true) && introText.includes(normalizeValue(DEFAULT_INTRO_PLACEHOLDER))) {
    pushIssue(issues, {
      code: 'template.placeholder_intro',
      field: 'template.offerIntro',
      message: 'Offertsidans introduktion använder fortfarande mallens hjälpteext.',
    });
  }

  input.offer.lineItems.forEach((item, index) => {
    if (normalizeValue(item.description).includes(normalizeValue(DEFAULT_PRODUCT_DESCRIPTION_PLACEHOLDER))) {
      pushIssue(issues, {
        code: 'line_item.placeholder_description',
        field: `lineItems[${index}].description`,
        message: `Rad ${index + 1} använder fortfarande hjälpteext i produktbeskrivningen.`,
      });
    }
  });

  if (offerPage?.document?.showTerms === false) {
    pushIssue(issues, {
      code: 'template.missing_terms',
      field: 'template.terms',
      message: 'Offerten saknar ett aktivt villkorsblock. Lägg till villkor eller skriv uttryckligen att något inte specificeras.',
    });
    return;
  }

  if (!termsBody) {
    if (!/offer-section--terms|juridiska villkor|villkor/i.test(input.generatedDocument)) {
      pushIssue(issues, {
        code: 'template.missing_terms',
        field: 'template.terms',
        message: 'Offerten saknar kommersiella villkor. Lägg till ett villkorsblock eller skriv uttryckligen vad som inte specificeras.',
      });
    }
    return;
  }

  if (termsBody === normalizeValue(DEFAULT_TERMS_PLACEHOLDER)) {
    pushIssue(issues, {
      code: 'template.placeholder_terms',
      field: 'template.terms',
      message: 'Villkorsblocket använder fortfarande mallens standardtext och behöver ersättas med riktiga kommersiella villkor.',
    });
  }
}

function validateSenderIdentity(
  issues: OfferPublishBlockingIssue[],
  input: PublishValidationInput,
): void {
  const normalizedOrgNumber = normalizeValue(input.branding.organizationNumber ?? input.company?.orgNumber);
  const normalizedAddress = normalizeValue([
    ...(input.branding.addressLines ?? []),
    input.company?.addressLine1 ?? '',
    input.company?.addressLine2 ?? '',
  ].join(' '));

  if (KNOWN_DEMO_ORG_NUMBERS.has(normalizedOrgNumber)) {
    pushIssue(issues, {
      code: 'sender.demo_org_number',
      field: 'company.orgNumber',
      message: 'Avsändarens organisationsnummer ser fortfarande ut som demo-/testdata.',
    });
  }

  if (normalizedAddress.includes('testgatan')) {
    pushIssue(issues, {
      code: 'sender.demo_address',
      field: 'company.addressLine1',
      message: 'Avsändaradressen ser fortfarande ut som demo-/testdata.',
    });
  }
}

export function collectOfferPublishBlockingIssues(
  input: PublishValidationInput,
): OfferPublishBlockingIssue[] {
  const issues: OfferPublishBlockingIssue[] = [];
  validatePlaceholderContent(issues, input);
  validateSenderIdentity(issues, input);
  return issues;
}

export function assertOfferReadyForSend(input: PublishValidationInput): void {
  const issues = collectOfferPublishBlockingIssues(input);
  if (issues.length === 0) return;

  const problem: OfferPublishBlockedProblem = {
    type: 'https://problems.soleria.se/offer-publish-blocked',
    title: 'Offer Publish Blocked',
    status: 422,
    detail: 'Offerten kan inte skickas förrän de blockerande kvalitetsproblemen är rättade.',
    retryable: false,
    blockingErrors: issues,
  };

  throw new ApiError(problem);
}
