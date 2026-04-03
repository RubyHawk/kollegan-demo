/**
 * Theme and font definitions — pure data, no React.
 * Used by the Utseende (appearance) settings page.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ThemeDef {
  id: string;
  label: string;
  desc: string;
  swatches: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
}

export type ThemeId = string;
export type ThemeMode = 'light' | 'dark' | 'auto';
export type FontSize = 'small' | 'medium' | 'large';

export interface FontOption {
  id: string;
  label: string;
  desc: string;
  css: string;
  sampleStyle: Record<string, string>;
}

// ─── Themes ────────────────────────────────────────────────────────────────────

export const THEMES: ThemeDef[] = [
  {
    id: 'soleria',
    label: 'Soleria',
    desc: 'Lila brand & klarblå',
    swatches: ['#281a39', '#35aaf3', '#3d9be9', '#eaeaf4', '#f1f2fa'],
    light: {
      '--page-bg':        '#f1f2fa',
      '--surface':        '#ffffff',
      '--surface-alt':    '#eaeaf4',
      '--surface-hover':  '#e0e0ef',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f3f3fb',
      '--surface-2':      '#eaeaf4',
      '--surface-3':      '#e1e1ef',
      '--surface-active': '#d6d6ea',
      '--border':         '#c4c4de',
      '--border-light':   '#e1e1ef',
      '--text-primary':   '#281a39',
      '--text-secondary': '#4a3860',
      '--text-muted':     '#8878a0',
      '--accent':         '#35aaf3',
      '--accent-light':   '#4dbeff',
      '--accent-subtle':  'oklch(0.68 0.16 224 / 0.08)',
      '--accent-border':  'oklch(0.68 0.16 224 / 0.22)',
    },
    dark: {
      '--page-bg':        '#130d1e',
      '--surface':        '#1c1530',
      '--surface-alt':    '#241d3a',
      '--surface-hover':  '#2c2444',
      '--surface-0':      '#1c1530',
      '--surface-1':      '#201938',
      '--surface-2':      '#271f42',
      '--surface-3':      '#2e264c',
      '--surface-active': '#362e58',
      '--border':         '#403060',
      '--border-light':   '#2a2244',
      '--text-primary':   '#ebe8f4',
      '--text-secondary': '#a898c8',
      '--text-muted':     '#6858a0',
      '--accent':         '#35aaf3',
      '--accent-light':   '#4dbeff',
      '--accent-subtle':  'oklch(0.68 0.16 224 / 0.1)',
      '--accent-border':  'oklch(0.68 0.16 224 / 0.22)',
    },
  },
  {
    id: 'claude',
    label: 'Claude',
    desc: 'Varm terracotta',
    swatches: ['#c96442', '#d97757', '#e9b8a0', '#e9e6dc', '#faf9f5'],
    light: {
      '--page-bg':        '#faf9f5',
      '--surface':        '#ffffff',
      '--surface-alt':    '#f3f0e8',
      '--surface-hover':  '#edeadf',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f7f5ed',
      '--surface-2':      '#f0ede4',
      '--surface-3':      '#e9e6dc',
      '--surface-active': '#e4e0d4',
      '--border':         '#d5d0c4',
      '--border-light':   '#e9e6dc',
      '--text-primary':   '#3d3929',
      '--text-secondary': '#6b6350',
      '--text-muted':     '#9c9480',
      '--accent':         '#c96442',
      '--accent-light':   '#d97757',
      '--accent-subtle':  'oklch(0.62 0.16 40 / 0.08)',
      '--accent-border':  'oklch(0.62 0.16 40 / 0.22)',
    },
    dark: {
      '--page-bg':        '#1a1915',
      '--surface':        '#262624',
      '--surface-alt':    '#2a2926',
      '--surface-hover':  '#33322e',
      '--surface-0':      '#262624',
      '--surface-1':      '#2a2926',
      '--surface-2':      '#302f2b',
      '--surface-3':      '#38362f',
      '--surface-active': '#3e3c34',
      '--border':         '#423f37',
      '--border-light':   '#33312b',
      '--text-primary':   '#e8e4d8',
      '--text-secondary': '#c3c0b6',
      '--text-muted':     '#8a8679',
      '--accent':         '#d97757',
      '--accent-light':   '#e09070',
      '--accent-subtle':  'oklch(0.68 0.15 42 / 0.1)',
      '--accent-border':  'oklch(0.68 0.15 42 / 0.22)',
    },
  },
  {
    id: 'catppuccin',
    label: 'Catppuccin',
    desc: 'Mjuk pastell lila',
    swatches: ['#8839ef', '#cba6f7', '#89dceb', '#f38ba8', '#a6e3a1'],
    light: {
      '--page-bg': '#eff1f5', '--surface': '#ffffff', '--surface-alt': '#e6e9ef',
      '--surface-hover': '#dce0e8', '--surface-0': '#ffffff', '--surface-1': '#eef0f5',
      '--surface-2': '#e6e9ef', '--surface-3': '#ccd0da', '--surface-active': '#bcc0cc',
      '--border': '#ccd0da', '--border-light': '#e6e9ef',
      '--text-primary': '#4c4f69', '--text-secondary': '#6c6f85', '--text-muted': '#8c8fa1',
      '--accent': '#8839ef', '--accent-light': '#a45bff',
      '--accent-subtle': 'oklch(0.55 0.24 310 / 0.08)', '--accent-border': 'oklch(0.55 0.24 310 / 0.22)',
    },
    dark: {
      '--page-bg': '#1e1e2e', '--surface': '#181825', '--surface-alt': '#27273a',
      '--surface-hover': '#313244', '--surface-0': '#1e1e2e', '--surface-1': '#232336',
      '--surface-2': '#2a2a3e', '--surface-3': '#313244', '--surface-active': '#45475a',
      '--border': '#45475a', '--border-light': '#313244',
      '--text-primary': '#cdd6f4', '--text-secondary': '#bac2de', '--text-muted': '#a6adc8',
      '--accent': '#cba6f7', '--accent-light': '#dbc1ff',
      '--accent-subtle': 'oklch(0.72 0.15 310 / 0.1)', '--accent-border': 'oklch(0.72 0.15 310 / 0.22)',
    },
  },
  {
    id: 'cosmic-night',
    label: 'Cosmic Night',
    desc: 'Djupt rymdlila',
    swatches: ['#6e56cf', '#a48fff', '#d8e6ff', '#ff5470', '#e4dfff'],
    light: {
      '--page-bg': '#f5f5ff', '--surface': '#ffffff', '--surface-alt': '#eeeeff',
      '--surface-hover': '#e8e6ff', '--surface-0': '#ffffff', '--surface-1': '#f5f5ff',
      '--surface-2': '#eeeeff', '--surface-3': '#e4dfff', '--surface-active': '#d8d2f8',
      '--border': '#d4cff0', '--border-light': '#e8e5f5',
      '--text-primary': '#2a2a4a', '--text-secondary': '#504a72', '--text-muted': '#7a7498',
      '--accent': '#6e56cf', '--accent-light': '#a48fff',
      '--accent-subtle': 'oklch(0.53 0.20 295 / 0.08)', '--accent-border': 'oklch(0.53 0.20 295 / 0.22)',
    },
    dark: {
      '--page-bg': '#0f0f1a', '--surface': '#18182a', '--surface-alt': '#1e1e35',
      '--surface-hover': '#282845', '--surface-0': '#18182a', '--surface-1': '#1c1c30',
      '--surface-2': '#222240', '--surface-3': '#2d2b55', '--surface-active': '#383670',
      '--border': '#333366', '--border-light': '#252548',
      '--text-primary': '#e2e2f5', '--text-secondary': '#b8b5d8', '--text-muted': '#8886b0',
      '--accent': '#a48fff', '--accent-light': '#bfaaff',
      '--accent-subtle': 'oklch(0.66 0.18 295 / 0.1)', '--accent-border': 'oklch(0.66 0.18 295 / 0.22)',
    },
  },
  {
    id: 'perpetuity',
    label: 'Perpetuity',
    desc: 'Fräsch teal',
    swatches: ['#06858e', '#4de8e8', '#c9e5e7', '#164955', '#e8f0f0'],
    light: {
      '--page-bg': '#e8f0f0', '--surface': '#ffffff', '--surface-alt': '#dfe9ea',
      '--surface-hover': '#d5e2e3', '--surface-0': '#ffffff', '--surface-1': '#eef4f4',
      '--surface-2': '#e2ecec', '--surface-3': '#d9eaea', '--surface-active': '#c9e5e7',
      '--border': '#b0d0d4', '--border-light': '#d9eaea',
      '--text-primary': '#0a4a55', '--text-secondary': '#1a6a72', '--text-muted': '#4a8a90',
      '--accent': '#06858e', '--accent-light': '#4de8e8',
      '--accent-subtle': 'oklch(0.58 0.12 195 / 0.08)', '--accent-border': 'oklch(0.58 0.12 195 / 0.22)',
    },
    dark: {
      '--page-bg': '#0a1a20', '--surface': '#0f2228', '--surface-alt': '#132a32',
      '--surface-hover': '#1a3540', '--surface-0': '#0f2228', '--surface-1': '#11262e',
      '--surface-2': '#143038', '--surface-3': '#164955', '--surface-active': '#1a5a68',
      '--border': '#1a5060', '--border-light': '#133540',
      '--text-primary': '#e0f4f4', '--text-secondary': '#90d0d4', '--text-muted': '#5aacb4',
      '--accent': '#4de8e8', '--accent-light': '#70f0f0',
      '--accent-subtle': 'oklch(0.82 0.12 190 / 0.1)', '--accent-border': 'oklch(0.82 0.12 190 / 0.22)',
    },
  },
  {
    id: 'nature',
    label: 'Nature',
    desc: 'Frisk och naturlig',
    swatches: ['#2e7d32', '#4caf50', '#81c784', '#c8e6c9', '#e8f5e9'],
    light: {
      '--page-bg': '#f8f5f0', '--surface': '#ffffff', '--surface-alt': '#f0ece4',
      '--surface-hover': '#e8e4db', '--surface-0': '#ffffff', '--surface-1': '#f5f2ec',
      '--surface-2': '#eeebe3', '--surface-3': '#e8f5e9', '--surface-active': '#c8e6c9',
      '--border': '#c8c0b4', '--border-light': '#e0dcd4',
      '--text-primary': '#3e2723', '--text-secondary': '#5d4037', '--text-muted': '#8d6e63',
      '--accent': '#2e7d32', '--accent-light': '#4caf50',
      '--accent-subtle': 'oklch(0.52 0.14 150 / 0.08)', '--accent-border': 'oklch(0.52 0.14 150 / 0.22)',
    },
    dark: {
      '--page-bg': '#1c2a1f', '--surface': '#1e2e22', '--surface-alt': '#243328',
      '--surface-hover': '#2d3e30', '--surface-0': '#1e2e22', '--surface-1': '#223226',
      '--surface-2': '#28382c', '--surface-3': '#3e4a3d', '--surface-active': '#4a5c48',
      '--border': '#3e5040', '--border-light': '#2a3c2e',
      '--text-primary': '#f0ebe5', '--text-secondary': '#c8c0b4', '--text-muted': '#8a9a80',
      '--accent': '#4caf50', '--accent-light': '#81c784',
      '--accent-subtle': 'oklch(0.62 0.16 145 / 0.1)', '--accent-border': 'oklch(0.62 0.16 145 / 0.22)',
    },
  },
  {
    id: 'mocha-mousse',
    label: 'Mocha Mousse',
    desc: 'Varm och jordnära',
    swatches: ['#A37764', '#C39E88', '#BAAB92', '#E4C7B8', '#F1F0E5'],
    light: {
      '--page-bg': '#F1F0E5', '--surface': '#ffffff', '--surface-alt': '#EBE9DC',
      '--surface-hover': '#E3E0D2', '--surface-0': '#ffffff', '--surface-1': '#F5F3E9',
      '--surface-2': '#EBE9DC', '--surface-3': '#E4C7B8', '--surface-active': '#DBBFAE',
      '--border': '#D0C4B4', '--border-light': '#E4DDD0',
      '--text-primary': '#56453F', '--text-secondary': '#7A6A5E', '--text-muted': '#A09484',
      '--accent': '#A37764', '--accent-light': '#C39E88',
      '--accent-subtle': 'oklch(0.58 0.08 40 / 0.08)', '--accent-border': 'oklch(0.58 0.08 40 / 0.22)',
    },
    dark: {
      '--page-bg': '#2d2521', '--surface': '#342c27', '--surface-alt': '#3a322c',
      '--surface-hover': '#443b34', '--surface-0': '#342c27', '--surface-1': '#382f2a',
      '--surface-2': '#3e352f', '--surface-3': '#4a3f38', '--surface-active': '#574a42',
      '--border': '#544840', '--border-light': '#3e352f',
      '--text-primary': '#F1F0E5', '--text-secondary': '#D4CCBE', '--text-muted': '#A09484',
      '--accent': '#C39E88', '--accent-light': '#D8B8A4',
      '--accent-subtle': 'oklch(0.68 0.07 42 / 0.1)', '--accent-border': 'oklch(0.68 0.07 42 / 0.22)',
    },
  },
  {
    id: 'tangerine',
    label: 'Tangerine',
    desc: 'Energisk och djärv',
    swatches: ['#e05d38', '#f07050', '#f3a080', '#d6e4f0', '#e8ebed'],
    light: {
      '--page-bg': '#e8ebed', '--surface': '#ffffff', '--surface-alt': '#e0e4e8',
      '--surface-hover': '#d8dce2', '--surface-0': '#ffffff', '--surface-1': '#f0f2f4',
      '--surface-2': '#e4e8ec', '--surface-3': '#d6e4f0', '--surface-active': '#c8d8e8',
      '--border': '#c4ccd4', '--border-light': '#dce0e6',
      '--text-primary': '#1c2433', '--text-secondary': '#3a4858', '--text-muted': '#6a7888',
      '--accent': '#e05d38', '--accent-light': '#f07050',
      '--accent-subtle': 'oklch(0.60 0.19 30 / 0.08)', '--accent-border': 'oklch(0.60 0.19 30 / 0.22)',
    },
    dark: {
      '--page-bg': '#1c2433', '--surface': '#222c3a', '--surface-alt': '#283242',
      '--surface-hover': '#303c4e', '--surface-0': '#222c3a', '--surface-1': '#252f3e',
      '--surface-2': '#2a3444', '--surface-3': '#2a3656', '--surface-active': '#344060',
      '--border': '#354560', '--border-light': '#2a3648',
      '--text-primary': '#e8ecf0', '--text-secondary': '#b4c0cc', '--text-muted': '#7a8ea0',
      '--accent': '#e05d38', '--accent-light': '#f07050',
      '--accent-subtle': 'oklch(0.60 0.19 30 / 0.1)', '--accent-border': 'oklch(0.60 0.19 30 / 0.22)',
    },
  },
  {
    id: 'bold-tech',
    label: 'Bold Tech',
    desc: 'Modern och kraftfull',
    swatches: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#dbeafe', '#f3f0ff'],
    light: {
      '--page-bg': '#f5f5ff', '--surface': '#ffffff', '--surface-alt': '#eeeeff',
      '--surface-hover': '#e6e4ff', '--surface-0': '#ffffff', '--surface-1': '#f8f7ff',
      '--surface-2': '#f0eeff', '--surface-3': '#e2ddf8', '--surface-active': '#d4cef2',
      '--border': '#d0c8f0', '--border-light': '#e8e4f8',
      '--text-primary': '#312e81', '--text-secondary': '#4b47a0', '--text-muted': '#7a76b0',
      '--accent': '#8b5cf6', '--accent-light': '#a78bfa',
      '--accent-subtle': 'oklch(0.55 0.22 290 / 0.08)', '--accent-border': 'oklch(0.55 0.22 290 / 0.22)',
    },
    dark: {
      '--page-bg': '#0f172a', '--surface': '#151d32', '--surface-alt': '#1a2440',
      '--surface-hover': '#232e50', '--surface-0': '#151d32', '--surface-1': '#18203a',
      '--surface-2': '#1e2844', '--surface-3': '#1e1b4b', '--surface-active': '#2a2668',
      '--border': '#2a2660', '--border-light': '#1e2548',
      '--text-primary': '#e0e7ff', '--text-secondary': '#b4bce0', '--text-muted': '#7a82b0',
      '--accent': '#8b5cf6', '--accent-light': '#a78bfa',
      '--accent-subtle': 'oklch(0.55 0.22 290 / 0.1)', '--accent-border': 'oklch(0.55 0.22 290 / 0.22)',
    },
  },
];

// ─── Font Options ──────────────────────────────────────────────────────────────

export const FONT_OPTIONS: readonly FontOption[] = [
  { id: 'inter', label: 'Inter', desc: 'Sans-serif', css: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif', sampleStyle: { fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' } },
  { id: 'system', label: 'System', desc: 'Standard', css: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', sampleStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' } },
  { id: 'dm-sans', label: 'DM Sans', desc: 'Geometrisk', css: '"DM Sans", ui-sans-serif, system-ui, sans-serif', sampleStyle: { fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' } },
  { id: 'geist', label: 'Geist', desc: 'Modern', css: '"Geist", ui-sans-serif, system-ui, sans-serif', sampleStyle: { fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif' } },
  { id: 'lora', label: 'Lora', desc: 'Serif', css: '"Lora", Georgia, serif', sampleStyle: { fontFamily: '"Lora", Georgia, serif' } },
  { id: 'cormorant', label: 'Cormorant', desc: 'Elegant serif', css: 'var(--font-cormorant), Georgia, serif', sampleStyle: { fontFamily: 'var(--font-cormorant), Georgia, serif' } },
  { id: 'jetbrains', label: 'JetBrains Mono', desc: 'Monospace', css: '"JetBrains Mono", ui-monospace, monospace', sampleStyle: { fontFamily: '"JetBrains Mono", ui-monospace, monospace' } },
  { id: 'source-serif', label: 'Source Serif', desc: 'Klassisk serif', css: '"Source Serif 4", Georgia, serif', sampleStyle: { fontFamily: '"Source Serif 4", Georgia, serif' } },
];

// ─── CSS properties themes control ─────────────────────────────────────────────

export const THEME_PROPS = [
  '--page-bg', '--surface', '--surface-alt', '--surface-hover',
  '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--surface-active',
  '--border', '--border-light', '--text-primary', '--text-secondary', '--text-muted',
  '--dot-color', '--grid-line-color', '--icon-muted',
  '--accent', '--accent-light', '--accent-subtle', '--accent-border',
];
