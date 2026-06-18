export function ScribbleStroke({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`fluffy-scribble ${className}`}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 300 24"
    >
      {/* Filled, tapered brush stroke — thick in the middle, tapering to points at each
          end — so it reads as a confident marker swoosh rather than a thin jagged line. */}
      <path
        className="fluffy-scribble__shadow"
        d="M2,16.6 C44,11.1 96,9.1 150,9.6 C206,10.1 256,12.1 298,13.6 C262,19.1 214,21.1 150,20.6 C96,20.1 46,19.6 2,16.6 Z"
      />
      <path
        className="fluffy-scribble__ink"
        d="M2,14 C44,8.5 96,6.5 150,7 C206,7.5 256,9.5 298,11 C262,16.5 214,18.5 150,18 C96,17.5 46,17 2,14 Z"
      />
    </svg>
  );
}
