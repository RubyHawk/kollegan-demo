export type Mode = 'idle' | 'call' | 'chat';
export type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

/**
 * Brand configuration that controls the visual identity and Vapi assistant
 * used by the unified VoiceContact component.
 */
export interface VoiceBrand {
  /** Display name shown in headers, status text, and messages */
  name: string;
  /** Vapi assistant ID (env var key or direct value) */
  assistantId: string;
  /** Primary accent color as Tailwind utility prefix, e.g. 'amber' or 'gold' */
  accentColor: string;
  /** Welcome message when a call starts */
  callStartMessage: string;
  /** Welcome message when chat mode opens */
  chatWelcomeMessage: string;
  /** Longer chat welcome message (used in floating/draggable variants) */
  chatWelcomeMessageLong: string;
  /** Error message when Vapi is not configured */
  configErrorMessage: string;
  /** Error message when call fails to connect */
  connectErrorMessage: string;
  /** Placeholder chat reply (for offline chat mode) */
  chatAutoReply: string;
  /** Whether to fetch hotel-info context before starting a call */
  fetchHotelInfo?: boolean;
  /**
   * Theme variant that controls the entire color scheme:
   * - 'light': Uses CSS custom properties (--surface, --border, etc.) — Kollegan style
   * - 'dark':  Uses navy/gold/cream Tailwind classes — Maja style
   */
  theme: 'light' | 'dark';
}
