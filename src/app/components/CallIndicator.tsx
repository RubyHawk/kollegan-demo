'use client';

interface Props {
  onCall: boolean;
}

export default function CallIndicator({ onCall }: Props) {
  if (!onCall) {
    return (
      <div className="flex items-center gap-2 text-sm text-cream-600">
        <div className="w-2 h-2 rounded-full bg-navy-700" />
        <span>Väntar på samtal</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-burgundy-950 border border-burgundy-800 rounded-full px-4 py-2 call-indicator">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-burgundy-400" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-burgundy-400 animate-ping" />
      </div>
      <span className="text-burgundy-400 text-sm font-semibold">Pågående samtal</span>
    </div>
  );
}
