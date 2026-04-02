import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Soleria',
  description: 'Soleria — Offertsystem',
};

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    var td = localStorage.getItem('themeData');
    if (td) {
      var data = JSON.parse(td);
      var vars = isDark ? data.dark : data.light;
      if (vars) {
        var root = document.documentElement;
        for (var k in vars) root.style.setProperty(k, vars[k]);
      }
    }
  } catch(e) {}
})();
`;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "overflow-hidden",
        inter.variable,
        cormorant.variable,
        jetbrainsMono.variable,
      )}
    >
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-dvh overflow-hidden antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
