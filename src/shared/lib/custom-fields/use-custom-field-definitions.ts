'use client';

import { useEffect, useState } from 'react';
import { listCustomFields } from '@shared/lib/api/custom-fields.api';
import type { CustomFieldDefinition, CustomFieldEntityType } from '@shared/lib/custom-fields/types';

/**
 * Loads the active custom-field definitions for an entity type (org-scoped via
 * the authenticated session). Read-only display data used by entity forms to
 * render their custom fields. Failures degrade silently to an empty list so the
 * host form is never blocked by a custom-fields outage.
 */
export function useCustomFieldDefinitions(entityType: CustomFieldEntityType): {
  definitions: CustomFieldDefinition[];
  loading: boolean;
} {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listCustomFields(entityType)
      .then((defs) => { if (active) setDefinitions(defs); })
      .catch(() => { if (active) setDefinitions([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entityType]);

  return { definitions, loading };
}
