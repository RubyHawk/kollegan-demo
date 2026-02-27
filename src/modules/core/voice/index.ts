/**
 * Voice module — public interface.
 *
 * Other modules ONLY import from this file.
 *
 * Layer structure:
 *   domain/    — value objects (VoiceBrand, call types)
 *   ai-tools/  — Vapi AI tool implementations (cross-domain, documented violations)
 *   ui/        — components/, hooks/ (client-side only)
 *   events/    — publishers/, subscribers/
 *   register.ts — tool registration at startup
 */

// UI — components
export { default as VoiceContact }   from './ui/components/voice-contact';
export { default as KolleganContact } from './ui/components/kollegan-contact';
export { default as MajaContact }     from './ui/components/maja-contact';
export type { VoiceContactProps }     from './ui/components/voice-contact';

// UI — hooks
export { useVapi } from './ui/hooks/use-vapi';

// Domain types
export type { VoiceBrand, Mode, CallStatus, Message } from './domain/voice-brand.vo';
