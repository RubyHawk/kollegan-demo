'use client';

import { ActivityEvent } from '@/lib/types';

interface Props {
  activities: ActivityEvent[];
}

const EVENT_ICONS: Record<ActivityEvent['type'], string> = {
  call_started: '📞',
  call_ended: '📵',
  rooms_queried: '🔍',
  room_locked: '🔒',
  room_confirmed: '✅',
  room_cancelled: '❌',
  info: 'ℹ️',
};

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  call_started: 'text-blue-400',
  call_ended: 'text-gray-400',
  rooms_queried: 'text-purple-400',
  room_locked: 'text-yellow-400',
  room_confirmed: 'text-green-400',
  room_cancelled: 'text-red-400',
  info: 'text-gray-400',
};

export default function ActivityLog({ activities }: Props) {
  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800 shrink-0">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Aktivitetslogg
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[600px]">
        {activities.length === 0 && (
          <p className="text-gray-700 text-xs text-center mt-10 leading-relaxed">
            Inga aktiviteter än.
            <br />
            Ring Maja för att börja!
          </p>
        )}

        {activities.map((event) => (
          <div key={event.id} className="flex gap-2.5 text-xs group">
            <span className="shrink-0 mt-0.5 text-base leading-none">
              {EVENT_ICONS[event.type] ?? 'ℹ️'}
            </span>
            <div className="min-w-0">
              <p className={['font-medium leading-snug', EVENT_COLORS[event.type]].join(' ')}>
                {event.message}
              </p>
              <p className="text-gray-700 mt-0.5">
                {new Date(event.timestamp).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
