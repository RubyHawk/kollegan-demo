export type PublicSiteCapabilities = {
  bookingEnabled: boolean;
  orderingEnabled: boolean;
};

const TRUE_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);

function readBooleanFlag(names: string[], defaultValue = false): boolean {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined) continue;
    return TRUE_FLAG_VALUES.has(raw.trim().toLowerCase());
  }
  return defaultValue;
}

export function isPublicBookingEnabled(): boolean {
  return readBooleanFlag(['FLUFFYS_PUBLIC_BOOKING_ENABLED', 'PUBLIC_BOOKING_ENABLED']);
}

export function isPublicOrderingEnabled(): boolean {
  return readBooleanFlag(['FLUFFYS_PUBLIC_ORDERING_ENABLED', 'PUBLIC_ORDERING_ENABLED']);
}

export function getPublicSiteCapabilities(): PublicSiteCapabilities {
  return {
    bookingEnabled: isPublicBookingEnabled(),
    orderingEnabled: isPublicOrderingEnabled(),
  };
}
