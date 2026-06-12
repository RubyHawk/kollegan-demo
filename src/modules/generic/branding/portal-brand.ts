/**
 * Portal brand resolution.
 *
 * Decides which workspace identity a tenant shows on the login page and in
 * the portal shell, so the decision lives in one place instead of being
 * duplicated per feature. Visual styling (CSS, layout) stays with the
 * consuming page; this module only owns the brand choice and its copy.
 *
 * Precedence: tenant preset (matched on organization slug) → platform brand.
 */

export type PortalBrandKey = 'platform' | 'fluffys';

export interface PortalBrand {
  key: PortalBrandKey;
  /** Display name shown in wordmarks and the login console. */
  name: string;
  /** Short label under the wordmark, e.g. "Intern arbetsyta". */
  workspaceLabel: string;
  /** One-sentence description of the workspace, used on the login scene. */
  tagline: string;
  /** Footer note describing what the login gives access to. */
  accessNote: string;
  /** Workspace areas highlighted on the login scene for tenant brands. */
  highlights: string[];
}

export interface PortalBrandTenant {
  organizationSlug: string;
  organizationName: string;
}

const PLATFORM_BRAND: PortalBrand = {
  key: 'platform',
  name: 'Soleria',
  workspaceLabel: 'Intern arbetsyta',
  tagline: 'Solerias arbetsyta för offert, order, planering och montering av solfilm.',
  accessNote: 'Åtkomst för offert, order, planering och montage.',
  highlights: [],
};

const TENANT_BRANDS: Record<string, PortalBrand> = {
  fluffys: {
    key: 'fluffys',
    name: "Fluffy's",
    workspaceLabel: 'Personalportal',
    tagline: 'Arbetsytan för teamet på Fluffy’s — allt som händer bakom disken på ett ställe.',
    accessNote: 'Åtkomst för schema, närvaro, meny och bokningar.',
    highlights: ['Schema och pass', 'Närvaro och incheckning', 'Meny och webbplats', 'Bokningar'],
  },
};

export function resolvePortalBrand(tenant: PortalBrandTenant | null | undefined): PortalBrand {
  if (!tenant) return PLATFORM_BRAND;
  const preset = TENANT_BRANDS[tenant.organizationSlug];
  if (!preset) return PLATFORM_BRAND;
  return { ...preset, name: tenant.organizationName.trim() || preset.name };
}
