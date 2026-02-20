import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grand Hotel Kollegan — Receptionsöversikt',
  description: 'Live-demo: AI-receptionist med Vapi + n8n',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">{children}</body>
    </html>
  );
}
