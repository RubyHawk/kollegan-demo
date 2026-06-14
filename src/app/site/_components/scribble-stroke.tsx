export function ScribbleStroke({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`fluffy-scribble ${className}`}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 260 28"
    >
      <path
        className="fluffy-scribble__shadow"
        d="M6 18 C34 9 64 18 92 13 C128 7 154 20 188 13 C216 8 236 10 254 7"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="fluffy-scribble__ink"
        d="M4 15 C39 22 63 8 98 14 C132 20 155 7 190 13 C219 18 239 12 256 17"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
