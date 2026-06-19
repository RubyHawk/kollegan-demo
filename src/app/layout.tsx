import type { Metadata } from 'next';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";
import { BRAND_MARK_PATH, BRAND_NAME, BRAND_TAGLINE } from '@shared/branding';
import {
  DEFAULT_THEME_ID,
  FONT_OPTIONS,
  FONT_SIZE_SCALES,
  THEMES,
} from './(dashboard)/(shell)/installningar/_components/theme-data';
import { THEME_COOKIE_KEYS, THEME_COOKIE_MAX_AGE, THEME_STORAGE_KEYS } from '@shared/lib/theme-preferences';

const FLUFFYS_MARK_PATH = '/fluffys/favicon.svg';

function iconSet(path: string): Metadata['icons'] {
  return {
    icon: path,
    shortcut: path,
    apple: path,
  };
}

function normalizeHost(host: string | null) {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

export async function generateMetadata(): Promise<Metadata> {
  const host = normalizeHost((await headers()).get('host'));

  if (host === 'portal.fluffys.se') {
    return {
      title: "Fluffy's Portal",
      description: "Fluffy's arbetsyta för kassa, bokningar, personal, närvaro och webbplats.",
      icons: iconSet(FLUFFYS_MARK_PATH),
      manifest: '/manifest.webmanifest',
      appleWebApp: {
        capable: true,
        title: "Fluffy's Portal",
        statusBarStyle: 'default',
      },
    };
  }

  if (host === 'fluffys.se' || host === 'www.fluffys.se') {
    return {
      title: "Fluffy's",
      description: "Fluffy's i Laxå - subs, pizza, panini, wraps och takeaway.",
      icons: iconSet(FLUFFYS_MARK_PATH),
    };
  }

  return {
    title: BRAND_NAME,
    description: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    icons: iconSet(BRAND_MARK_PATH),
  };
}

const defaultTheme = THEMES.find((theme) => theme.id === DEFAULT_THEME_ID) ?? THEMES[0];
const themePayload = {
  defaultThemeId: defaultTheme.id,
  themes: Object.fromEntries(
    THEMES.map((theme) => [
      theme.id,
      { light: theme.light, dark: theme.dark },
    ]),
  ),
  fonts: Object.fromEntries(FONT_OPTIONS.map((font) => [font.id, font.css])),
  fontSizeScales: FONT_SIZE_SCALES,
  storageKeys: THEME_STORAGE_KEYS,
  cookieKeys: THEME_COOKIE_KEYS,
  cookieMaxAge: THEME_COOKIE_MAX_AGE,
};

const themeScript = `
(function() {
  try {
    var payload = ${JSON.stringify(themePayload)};
    var validModes = { light: true, dark: true, auto: true };

    function readCookie(name) {
      var prefix = name + '=';
      var parts = document.cookie ? document.cookie.split('; ') : [];
      for (var i = 0; i < parts.length; i += 1) {
        if (parts[i].indexOf(prefix) === 0) return decodeURIComponent(parts[i].slice(prefix.length));
      }
      return null;
    }

    function writeCookie(name, value) {
      document.cookie = name + '=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + payload.cookieMaxAge + '; SameSite=Lax';
    }

    function readStored(storageKey, cookieKey) {
      try {
        var local = localStorage.getItem(storageKey);
        if (local) return local;
      } catch (e) {}
      return readCookie(cookieKey);
    }

    function injectStyle(id, css) {
      var node = document.getElementById(id);
      if (!node) {
        node = document.createElement('style');
        node.id = id;
        document.head.appendChild(node);
      }
      node.textContent = css;
    }

    function getFontSizeCss(scale) {
      if (scale === 1) {
        return '.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl { transition: font-size 150ms ease-out, line-height 150ms ease-out; }';
      }

      return [
        '.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl { transition: font-size 150ms ease-out, line-height 150ms ease-out; }',
        '.text-xs { font-size: ' + (0.75 * scale).toFixed(4) + 'rem !important; line-height: ' + (1 * scale).toFixed(4) + 'rem !important; }',
        '.text-sm { font-size: ' + (0.875 * scale).toFixed(4) + 'rem !important; line-height: ' + (1.25 * scale).toFixed(4) + 'rem !important; }',
        '.text-base { font-size: ' + (1 * scale).toFixed(4) + 'rem !important; line-height: ' + (1.5 * scale).toFixed(4) + 'rem !important; }',
        '.text-lg { font-size: ' + (1.125 * scale).toFixed(4) + 'rem !important; line-height: ' + (1.75 * scale).toFixed(4) + 'rem !important; }',
        '.text-xl { font-size: ' + (1.25 * scale).toFixed(4) + 'rem !important; line-height: ' + (1.75 * scale).toFixed(4) + 'rem !important; }',
        '.text-2xl { font-size: ' + (1.5 * scale).toFixed(4) + 'rem !important; line-height: ' + (2 * scale).toFixed(4) + 'rem !important; }',
        '.text-3xl { font-size: ' + (1.875 * scale).toFixed(4) + 'rem !important; line-height: ' + (2.25 * scale).toFixed(4) + 'rem !important; }'
      ].join('\\n');
    }

    var theme = readStored(payload.storageKeys.mode, payload.cookieKeys.mode) || 'light';
    if (!validModes[theme]) theme = 'light';
    try { localStorage.setItem(payload.storageKeys.mode, theme); } catch (e) {}
    writeCookie(payload.cookieKeys.mode, theme);

    var isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    var accent = readStored(payload.storageKeys.accent, payload.cookieKeys.accent) || payload.defaultThemeId;
    if (!payload.themes[accent]) accent = payload.defaultThemeId;
    try { localStorage.setItem(payload.storageKeys.accent, accent); } catch (e) {}
    writeCookie(payload.cookieKeys.accent, accent);

    var themeData = payload.themes[accent] || payload.themes[payload.defaultThemeId];
    try { localStorage.setItem(payload.storageKeys.data, JSON.stringify(themeData)); } catch (e) {}

    var vars = isDark ? themeData.dark : themeData.light;
    if (vars) {
      var root = document.documentElement;
      root.setAttribute('data-accent-theme', accent);
      for (var k in vars) root.style.setProperty(k, vars[k]);
    }

    var fontFamily = readStored(payload.storageKeys.fontFamily, payload.cookieKeys.fontFamily) || 'inter';
    if (!payload.fonts[fontFamily]) fontFamily = 'inter';
    try { localStorage.setItem(payload.storageKeys.fontFamily, fontFamily); } catch (e) {}
    writeCookie(payload.cookieKeys.fontFamily, fontFamily);
    injectStyle(
      'font-family-override',
      fontFamily === 'inter' ? '' : ('body { font-family: ' + payload.fonts[fontFamily] + ' !important; }')
    );

    var fontSize = readStored(payload.storageKeys.fontSize, payload.cookieKeys.fontSize) || 'medium';
    if (!payload.fontSizeScales[fontSize]) fontSize = 'medium';
    try { localStorage.setItem(payload.storageKeys.fontSize, fontSize); } catch (e) {}
    writeCookie(payload.cookieKeys.fontSize, fontSize);
    injectStyle('font-size-override', getFontSizeCss(payload.fontSizeScales[fontSize] || 1));

    if (theme === 'auto' && window.matchMedia) {
      var media = window.matchMedia('(prefers-color-scheme: dark)');
      var handler = function(event) {
        var nextDark = !!event.matches;
        document.documentElement.classList.toggle('dark', nextDark);
        var nextVars = nextDark ? themeData.dark : themeData.light;
        for (var key in nextVars) document.documentElement.style.setProperty(key, nextVars[key]);
      };
      if (media.addEventListener) media.addEventListener('change', handler);
      else if (media.addListener) media.addListener(handler);
    }
  } catch(e) {}
})();
`;

const inter = localFont({
  src: '../../public/fonts/inter-variable.woff2',
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = localFont({
  src: [
    { path: '../../public/fonts/cormorant-garamond-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/cormorant-garamond-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/cormorant-garamond-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/cormorant-garamond-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: '../../public/fonts/jetbrains-mono-variable.woff2',
  variable: '--font-mono',
  display: 'swap',
});

const instrumentSerif = localFont({
  src: [
    { path: '../../public/fonts/instrument-serif-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/instrument-serif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Heavy poster-display face for the Fluffy public marketing site headlines.
const archivoBlack = localFont({
  src: '../../public/fonts/archivo-black-400.woff2',
  variable: '--font-archivo-black',
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
        instrumentSerif.variable,
        archivoBlack.variable,
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
