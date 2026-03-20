/**
 * Public offer layout — minimal, no sidebar, no auth required.
 * Used for the recipient signing experience at /offers/public/[token].
 *
 * This layout sits under the root app/layout.tsx (which provides html/body),
 * so it only needs to wrap children in a minimal styled container.
 */

export default function PublicOfferLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100dvh', background: '#f8fafc', overflowY: 'auto' }}>
      {children}
    </div>
  );
}
