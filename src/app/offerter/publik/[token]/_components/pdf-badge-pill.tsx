export function PdfBadgePill({
  className = '',
  labelClassName = '',
}: {
  className?: string;
  labelClassName?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex min-w-[34px] items-center justify-center rounded-full bg-red-600 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] leading-none text-white ${className}`}
    >
      <span className={labelClassName}>PDF</span>
    </span>
  );
}
