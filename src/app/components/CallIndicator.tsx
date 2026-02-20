'use client';

interface Props {
  onCall: boolean;
}

export default function CallIndicator({ onCall }: Props) {
  if (!onCall) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <div className="w-2 h-2 rounded-full bg-stone-300" />
        <span>Väntar på samtal</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 call-indicator">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
      </div>
      <span className="text-red-600 text-sm font-semibold">Pågående samtal</span>
    </div>
  );
}
