'use client';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'amber' | 'emerald' | 'indigo' | 'none';
  rounded?: string;
}

export default function GlassPanel({
  children,
  className = '',
  glow = 'none',
  rounded = 'rounded-2xl',
}: GlassPanelProps) {
  const glowClass = glow !== 'none' ? `shadow-glow-${glow}` : 'shadow-card';
  return (
    <div className={`glass-panel ${rounded} ${glowClass} ${className}`}>
      {children}
    </div>
  );
}
