'use client';

interface LoginConsoleHeaderProps {
  mode: 'login' | 'mfa';
  title: string;
  subtitle: string;
}

export function LoginConsoleHeader({
  mode,
  title,
  subtitle,
}: LoginConsoleHeaderProps) {
  return (
    <header className="auth-console-header">
      <p className="auth-console-header__eyebrow">
        {mode === 'login' ? 'Intern arbetsportal' : 'Verifierad åtkomst'}
      </p>
      <h1 className="auth-console-header__title">{title}</h1>
      <p className="auth-console-header__subtitle">{subtitle}</p>
    </header>
  );
}
