'use client';

import Image from 'next/image';

export function InstallationTools() {
  return (
    <div className="auth-install-tool-stack">
      <Image
        className="auth-install-tools-art"
        src="/auth/generated/install-workbench-tools.png"
        alt=""
        aria-hidden="true"
        width={1883}
        height={658}
        priority
        sizes="(max-width: 640px) 96vw, (max-width: 1100px) 88vw, 58vw"
      />
      <span className="auth-install-spray">
        <span className="auth-install-spray-cone" />
        <span className="auth-install-spray-drop auth-install-spray-drop-a" />
        <span className="auth-install-spray-drop auth-install-spray-drop-b" />
        <span className="auth-install-spray-drop auth-install-spray-drop-c" />
      </span>
    </div>
  );
}
