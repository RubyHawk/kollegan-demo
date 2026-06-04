import type {
  LeadIntakeFieldConfig,
  LeadIntakeFieldMapping,
  ParsedLeadIntakeSubmission,
} from '../domain/lead-intake.entity';

export const DEFAULT_FRAMER_FIELD_CONFIG: LeadIntakeFieldConfig = {
  version: 1,
  fields: [
    { key: 'name', label: 'Namn', target: 'name', required: true, order: 10 },
    { key: 'email', label: 'Email', target: 'email', required: true, order: 20 },
    { key: 'phone', label: 'Telefon', target: 'phone', order: 30 },
    { key: 'address', label: 'Adress', target: 'address', order: 40 },
    { key: 'postalCode', label: 'Postnummer', target: 'postalCode', order: 50 },
    { key: 'requestedService', label: 'Tjänst', target: 'requestedService', order: 60 },
    { key: 'message', label: 'Meddelande', target: 'message', order: 70 },
    { key: 'referralSource', label: 'Hur hittade du Soleria?', target: 'referralSource', order: 80 },
  ],
};

function normalizeLabel(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/:+$/g, '')
    .trim();
}

function cleanValue(value: string, target: LeadIntakeFieldMapping['target']): string {
  const cleaned = value.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
  if (target === 'message' || target === 'custom') return cleaned;
  const withoutTrailingCommas = cleaned.replace(/,+$/g, '').trim();
  if (target === 'postalCode') return withoutTrailingCommas.replace(/\s+/g, '');
  if (target === 'address') return withoutTrailingCommas;
  return withoutTrailingCommas;
}

function applyParsedField(
  output: ParsedLeadIntakeSubmission,
  mapping: LeadIntakeFieldMapping,
  rawValue: string,
) {
  const value = cleanValue(rawValue, mapping.target);
  output.rawFields[mapping.key] = value;
  if (!value) return;

  switch (mapping.target) {
    case 'name':
      output.name = value;
      break;
    case 'email':
      output.email = value;
      break;
    case 'phone':
      output.phone = value;
      break;
    case 'address':
      output.address = value;
      break;
    case 'postalCode':
      output.postalCode = value;
      break;
    case 'requestedService':
      output.requestedService = value;
      break;
    case 'message':
      output.message = value;
      break;
    case 'referralSource':
      output.referralSource = value;
      break;
    case 'custom':
      output.customFields[mapping.key] = value;
      break;
  }
}

export function coerceFieldConfig(value: unknown): LeadIntakeFieldConfig {
  const raw = value as Partial<LeadIntakeFieldConfig> | null | undefined;
  if (!raw || raw.version !== 1 || !Array.isArray(raw.fields)) return DEFAULT_FRAMER_FIELD_CONFIG;

  const fields = raw.fields.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const field = candidate as Partial<LeadIntakeFieldMapping>;
    if (!field.key || !field.label || !field.target) return [];
    if (!['name', 'email', 'phone', 'address', 'postalCode', 'requestedService', 'message', 'referralSource', 'custom'].includes(field.target)) {
      return [];
    }
    return [{
      key: String(field.key).trim(),
      label: String(field.label).trim(),
      target: field.target,
      required: Boolean(field.required),
      order: Number.isFinite(field.order) ? Number(field.order) : 999,
    }];
  });

  return fields.length ? { version: 1, fields } : DEFAULT_FRAMER_FIELD_CONFIG;
}

export function parseLeadIntakeEmail(text: string, config: LeadIntakeFieldConfig): ParsedLeadIntakeSubmission {
  const fields = [...config.fields].sort((a, b) => a.order - b.order);
  const byLabel = new Map(fields.map((field) => [normalizeLabel(field.label), field]));
  const output: ParsedLeadIntakeSubmission = {
    customFields: {},
    rawFields: {},
    missingRequired: [],
  };

  let active: LeadIntakeFieldMapping | null = null;
  let activeLines: string[] = [];

  const flush = () => {
    if (!active) return;
    applyParsedField(output, active, activeLines.join('\n'));
    active = null;
    activeLines = [];
  };

  for (const line of text.replace(/\r/g, '').split('\n')) {
    const match = line.match(/^\s*([^:]{1,120}):\s*(.*)$/);
    const mapping = match ? byLabel.get(normalizeLabel(match[1] ?? '')) : undefined;

    if (mapping) {
      flush();
      active = mapping;
      activeLines = [match?.[2] ?? ''];
      continue;
    }

    if (active) activeLines.push(line);
  }
  flush();

  for (const field of fields) {
    if (!field.required) continue;
    const value = output.rawFields[field.key];
    if (!value?.trim()) output.missingRequired.push(field.key);
  }

  return output;
}

export function normalizeEmail(value?: string | null): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

export function normalizePhone(value?: string | null): string | null {
  const digits = value?.replace(/\D+/g, '');
  return digits || null;
}

export function normalizeIntakeAddress(value: string): string {
  return value.trim().toLowerCase();
}
