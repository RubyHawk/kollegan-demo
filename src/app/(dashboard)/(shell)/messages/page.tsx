/**
 * /messages
 *
 * Messaging hub — internal team messages and AI-call transcripts.
 * Placeholder with conversation list preview; real-time chat wired up
 * once the messaging service is in place.
 */

export default function MessagesPage() {
  const convos = [
    {
      id: 1,
      name: 'Anna Lindström',
      preview: 'Tack för återkopplingen! Jag kollar med teamet och…',
      time: '09:42',
      unread: 2,
      initials: 'AL',
      color: 'bg-violet-500',
      online: true,
    },
    {
      id: 2,
      name: 'AI-samtal #1284',
      preview: 'Gästen frågade om tidig incheckning. Rummet bokades för…',
      time: '08:15',
      unread: 0,
      initials: 'AI',
      color: 'bg-[var(--accent)]',
      online: false,
      isAi: true,
    },
    {
      id: 3,
      name: 'Erik Bergström',
      preview: 'Kan vi boka ett möte på fredag?',
      time: 'Igår',
      unread: 1,
      initials: 'EB',
      color: 'bg-blue-500',
      online: false,
    },
    {
      id: 4,
      name: 'AI-samtal #1283',
      preview: 'Kunden ville avboka rum 204, ny bokning för lördag…',
      time: 'Igår',
      unread: 0,
      initials: 'AI',
      color: 'bg-[var(--accent)]',
      online: false,
      isAi: true,
    },
    {
      id: 5,
      name: 'Maria Johansson',
      preview: 'Rapporten är klar, se bifogad fil.',
      time: 'Mån',
      unread: 0,
      initials: 'MJ',
      color: 'bg-emerald-500',
      online: true,
    },
  ];

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Meddelanden</h1>
          <p className="text-sm text-[var(--text-muted)]">Teamkommunikation och AI-samtalsutskrifter.</p>
        </div>
        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium opacity-40 cursor-not-allowed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt meddelande
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Conversation list with overlay */}
        <div className="md:col-span-1 relative rounded-2xl border border-[var(--border)] overflow-hidden">

          {/* Coming soon overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]/80 backdrop-blur-sm">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">Under utveckling</p>
            <p className="text-[10px] text-[var(--text-muted)] text-center px-4 leading-relaxed">
              Realtidschat och samtalsutskrifter kommer snart.
            </p>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-alt)]">
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input disabled type="search" placeholder="Sök…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs placeholder:text-[var(--text-muted)] opacity-50 focus:outline-none" />
            </div>
          </div>

          {/* Conversation list */}
          {convos.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 bg-[var(--surface)] select-none cursor-default">
              <div className="relative shrink-0">
                <div className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {c.initials}
                </div>
                {c.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--surface)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{c.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">{c.time}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Empty state / chat area */}
        <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Välj ett samtal</p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
              Välj ett meddelande till vänster för att läsa eller svara. Realtidschat och AI-utskrifter aktiveras snart.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
