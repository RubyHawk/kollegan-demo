import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Kollegan',
  description: 'Kollegan — AI-driven arbetsplattform',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning className={cn("h-full", "overflow-hidden")}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600;700&family=Geist:wght@400;500;600;700&family=Lato:wght@300;400;700&family=Lora:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400&family=Open+Sans:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Source+Sans+3:wght@300;400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-inter: 'Inter', system-ui, sans-serif;
            --font-cormorant: 'Cormorant Garamond', Georgia, serif;
            --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
          }
        `}</style>
      </head>
      <body className="h-dvh overflow-hidden antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
