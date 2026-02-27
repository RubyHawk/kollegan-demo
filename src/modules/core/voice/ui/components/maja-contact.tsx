'use client';

import VoiceContact from './voice-contact';
import type { VoiceBrand } from '../../domain/voice-brand.vo';

const MAJA_BRAND: VoiceBrand = {
  name: 'Maja',
  assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '',
  accentColor: 'gold',
  callStartMessage:
    'Välkommen till Grand Hotel Kollegan, det är Maja i receptionen. Hur kan jag hjälpa dig idag?',
  chatWelcomeMessage: 'Hej! Skriv ditt meddelande så hjälper jag dig.',
  chatWelcomeMessageLong:
    'Hej! Skriv ditt meddelande så hjälper jag dig. Vill du boka rum rekommenderar jag att ringa mig för snabbast hjälp!',
  configErrorMessage:
    'Vapi är inte konfigurerat ännu. Lägg till NEXT_PUBLIC_VAPI_PUBLIC_KEY och NEXT_PUBLIC_VAPI_ASSISTANT_ID i din .env.local-fil.',
  connectErrorMessage: 'Kunde inte ansluta samtalet. Kontrollera din Vapi-konfiguration.',
  chatAutoReply:
    'Tack för ditt meddelande! För att boka rum rekommenderar jag att ringa mig — tryck på telefonikonen ovan så kan jag hjälpa dig direkt.',
  fetchHotelInfo: false,
  theme: 'dark',
};

interface MajaContactProps {
  variant?: 'floating' | 'sidebar';
}

export default function MajaContact({ variant = 'floating' }: MajaContactProps) {
  return <VoiceContact variant={variant} brand={MAJA_BRAND} />;
}
