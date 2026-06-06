import type { CSSProperties, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (grip: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const grip = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab touch-none rounded-[var(--ui-radius-sm)] p-1 text-[var(--ui-text-muted)] opacity-0 transition-opacity hover:text-[var(--ui-accent)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] active:cursor-grabbing group-hover/row:opacity-100"
      aria-label="Dra för att sortera"
      tabIndex={-1}
    >
      <GripVertical size={16} strokeWidth={1.75} aria-hidden />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(grip)}
    </div>
  );
}
