# Branding And Theming

Branding and theming are related but separate.

## Branding Precedence

For public offers, PDFs, and emails:

```txt
document override
→ company branding
→ organization branding
→ platform branding
```

Definitions:

- `platformBranding`: Kollegan/Soleria product identity.
- `organizationBranding`: tenant-level default branding.
- `companyBranding`: selling company identity used on offers, PDFs, emails, and public pages.
- `documentOverrideBranding`: rare per-offer or per-template override.

Customer names, addresses, project sites, contacts, and notes are not branding; they are business data.

## Theme Precedence

For internal app UI:

```txt
user preference
→ organization theme
→ platform default
```

User preferences may affect internal app UI only. They must not alter public offers, PDFs, emails, or customer-facing documents.

## Semantic Tokens

Use semantic variables:

```txt
--accent
--surface
--surface-alt
--surface-hover
--border
--border-light
--text-primary
--text-secondary
--text-muted
--status-success-bg
--status-success-text
--status-warning-bg
--status-warning-text
--status-danger-bg
--status-danger-text
```

New or extracted feature UI must not use raw Tailwind color families for business states.

## Target Boundary

Branding logic should converge into:

```txt
src/modules/generic/branding/
```

Existing offer branding helpers must be reconciled into this boundary rather than duplicated.

