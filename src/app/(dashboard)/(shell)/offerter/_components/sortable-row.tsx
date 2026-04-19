import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

export function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (grip: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const grip = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover/row:opacity-100 transition-opacity"
      aria-label="Dra för att sortera"
      tabIndex={-1}
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
        <circle cx="3" cy="2" r="1.25" /><circle cx="7" cy="2" r="1.25" />
        <circle cx="3" cy="7" r="1.25" /><circle cx="7" cy="7" r="1.25" />
        <circle cx="3" cy="12" r="1.25" /><circle cx="7" cy="12" r="1.25" />
      </svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(grip)}
    </div>
  );
}
