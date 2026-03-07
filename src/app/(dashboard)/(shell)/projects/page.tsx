'use client';

/**
 * /projects
 *
 * Project workspace — track active projects with full CRUD.
 * Connected to GET/POST /api/projects and PATCH/DELETE /api/projects/[id].
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@shared/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus   = 'active' | 'review' | 'planned' | 'done' | 'archived';
type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

interface Project {
  id:          string;
  name:        string;
  description: string | null;
  status:      ProjectStatus;
  priority:    ProjectPriority;
  progress:    number;
  ownerId:     string | null;
  dueDate:     string | null;
  startDate:   string | null;
  tags:        string[];
  createdBy:   string;
  taskCount:   number;
  tasksDone:   number;
  createdAt:   string;
  updatedAt:   string;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Aktiv', review: 'Granskning', planned: 'Planerad', done: 'Klar', archived: 'Arkiverad',
};

const STATUS_STYLE: Record<ProjectStatus, string> = {
  active:   'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  review:   'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
  planned:  'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]',
  done:     'bg-[var(--accent)]/10 text-[var(--accent)]',
  archived: 'bg-[var(--surface-alt)] text-[var(--text-muted)]',
};

const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  low: 'Låg', medium: 'Medium', high: 'Hög', critical: 'Kritisk',
};

const PRIORITY_STYLE: Record<ProjectPriority, string> = {
  low: 'text-[var(--text-muted)]', medium: 'text-blue-600 dark:text-blue-400',
  high: 'text-amber-600 dark:text-amber-400', critical: 'text-red-600 dark:text-red-400',
};

const STATUS_TABS: { id: ProjectStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Alla' }, { id: 'active', label: 'Aktiva' },
  { id: 'review', label: 'Granskning' }, { id: 'planned', label: 'Planerade' }, { id: 'done', label: 'Klara' },
];

const EMPTY_FORM = {
  name: '', description: '', status: 'active' as ProjectStatus,
  priority: 'medium' as ProjectPriority, progress: 0, dueDate: '', startDate: '', tags: '',
};

const fmtDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<ProjectStatus | 'all'>('all');
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editing,  setEditing]  = useState<Project | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [acting,   setActing]   = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (tab !== 'all') params.set('status', tab);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      const json = await res.json() as { data: { projects: Project[]; total: number } };
      setProjects(json.data.projects);
      setTotal(json.data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setError(null); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? '', status: p.status, priority: p.priority,
      progress: p.progress, dueDate: p.dueDate?.slice(0, 10) ?? '', startDate: p.startDate?.slice(0, 10) ?? '',
      tags: p.tags.join(', '),
    });
    setShowForm(true); setError(null);
  };

  const saveProject = useCallback(async () => {
    if (!form.name.trim()) { setError('Projektnamn krävs.'); return; }
    setSaving(true); setError(null);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url    = editing ? `/api/projects/${editing.id}` : '/api/projects';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), description: form.description.trim() || null,
          status: form.status, priority: form.priority, progress: Number(form.progress),
          dueDate:   form.dueDate   ? new Date(form.dueDate).toISOString()   : null,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, editing, load]);

  const deleteProject = useCallback(async (id: string) => {
    if (!confirm('Ta bort projektet?')) return;
    setActing(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Fel ${res.status}`);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActing(null);
    }
  }, [load]);

  const counts = {
    active:  projects.filter(p => p.status === 'active').length,
    review:  projects.filter(p => p.status === 'review').length,
    planned: projects.filter(p => p.status === 'planned').length,
    done:    projects.filter(p => p.status === 'done').length,
  };

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Projekt</h1>
          <p className="text-sm text-[var(--text-muted)]">AI-implementationer, milstolpar och leveranser.</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt projekt
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aktiva',     value: counts.active,  color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Granskning', value: counts.review,  color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Planerade',  value: counts.planned, color: 'text-[var(--text-muted)]' },
          { label: 'Klara',      value: counts.done,    color: 'text-[var(--accent)]' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{editing ? 'Redigera projekt' : 'Nytt projekt'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
          </div>
          <div className="p-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Projektnamn *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="t.ex. Grand Hotel — AI-reception"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Beskrivning</label>
              <textarea value={form.description} rows={2} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Valfri projektbeskrivning…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                {(['planned','active','review','done','archived'] as ProjectStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Prioritet</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ProjectPriority }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                {(['low','medium','high','critical'] as ProjectPriority[]).map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Framsteg (0–100)</label>
              <input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Taggar (kommaseparerade)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, Hotel, Live"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Startdatum</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Förfallodatum</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-[var(--border-light)]">
              <button type="button" onClick={() => void saveProject()} disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? 'Sparar…' : editing ? 'Spara ändringar' : 'Skapa projekt'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto shrink-0">
          {STATUS_TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                tab === t.id ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" placeholder="Sök projekt…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
        </div>
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar projekt…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className={cn('rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-opacity', acting === p.id && 'opacity-50')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                    <span className={`text-xs font-medium ${PRIORITY_STYLE[p.priority]}`}>· {PRIORITY_LABEL[p.priority]}</span>
                  </div>
                  {p.description && <p className="text-xs text-[var(--text-muted)] mb-0.5 line-clamp-1">{p.description}</p>}
                  <p className="text-xs text-[var(--text-muted)]">
                    Förfall: {fmtDate(p.dueDate)}{p.taskCount > 0 ? ` · ${p.tasksDone}/${p.taskCount} uppgifter` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  <button type="button" onClick={() => openEdit(p)} className="text-xs text-[var(--accent)] hover:underline">Redigera</button>
                  <button type="button" onClick={() => void deleteProject(p.id)} disabled={acting === p.id}
                    className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">Ta bort</button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Framsteg</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-alt)]">
                  <div className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] font-medium">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Inga projekt ännu</p>
                <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Nytt projekt&rdquo; för att komma igång.</p>
              </div>
            </div>
          )}
        </div>
      )}
      {total > projects.length && (
        <p className="text-xs text-center text-[var(--text-muted)]">Visar {projects.length} av {total} projekt</p>
      )}
    </div>
  );
}
