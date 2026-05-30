'use client';

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage">
      <div className="auth-window" aria-hidden="true">
        <div className="auth-window__rays" />
        <svg
          className="auth-window__city"
          viewBox="0 0 560 380"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="auth-win-sky" x1="0" y1="0" x2="0" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(195 218 235)" />
              <stop offset="58%" stopColor="rgb(210 228 220)" />
              <stop offset="100%" stopColor="rgb(190 210 200)" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="560" height="380" fill="url(#auth-win-sky)" />

          {/* Buildings — far layer */}
          <g fill="rgb(148 165 155 / 0.44)">
            <rect x="0"   y="192" width="46" height="188" />
            <rect x="50"  y="162" width="36" height="218" />
            <rect x="90"  y="202" width="28" height="178" />
            <rect x="122" y="142" width="50" height="238" />
            <rect x="176" y="180" width="32" height="200" />
            <rect x="212" y="110" width="58" height="270" />
            <rect x="274" y="154" width="40" height="226" />
            <rect x="318" y="134" width="44" height="246" />
            <rect x="366" y="180" width="32" height="200" />
            <rect x="402" y="120" width="52" height="260" />
            <rect x="458" y="168" width="36" height="212" />
            <rect x="498" y="150" width="44" height="230" />
          </g>

          {/* Building windows */}
          <g fill="rgb(255 240 190 / 0.3)">
            <rect x="130" y="152" width="8" height="6" /><rect x="142" y="152" width="8" height="6" /><rect x="154" y="152" width="8" height="6" />
            <rect x="130" y="166" width="8" height="6" /><rect x="154" y="166" width="8" height="6" />
            <rect x="218" y="120" width="9" height="7" /><rect x="231" y="120" width="9" height="7" /><rect x="244" y="120" width="9" height="7" />
            <rect x="218" y="136" width="9" height="7" /><rect x="231" y="136" width="9" height="7" /><rect x="244" y="136" width="9" height="7" />
            <rect x="218" y="152" width="9" height="7" /><rect x="244" y="152" width="9" height="7" />
            <rect x="323" y="144" width="8" height="6" /><rect x="335" y="144" width="8" height="6" /><rect x="347" y="144" width="8" height="6" />
            <rect x="323" y="158" width="8" height="6" /><rect x="347" y="158" width="8" height="6" />
            <rect x="408" y="130" width="9" height="7" /><rect x="421" y="130" width="9" height="7" /><rect x="434" y="130" width="9" height="7" />
            <rect x="408" y="145" width="9" height="7" /><rect x="421" y="145" width="9" height="7" /><rect x="434" y="145" width="9" height="7" />
          </g>

          {/* Ground */}
          <rect x="0" y="302" width="560" height="78" fill="rgb(50 70 45 / 0.62)" />

          {/* Trees */}
          <g fill="rgb(34 66 36 / 0.9)">
            <ellipse cx="38"  cy="288" rx="36" ry="50" />
            <ellipse cx="112" cy="294" rx="30" ry="44" />
            <ellipse cx="186" cy="282" rx="38" ry="54" />
            <ellipse cx="260" cy="290" rx="32" ry="46" />
            <ellipse cx="334" cy="284" rx="36" ry="52" />
            <ellipse cx="408" cy="292" rx="30" ry="44" />
            <ellipse cx="480" cy="282" rx="36" ry="52" />
          </g>

          {/* Tree trunks */}
          <g fill="rgb(38 28 15 / 0.52)">
            <rect x="32"  y="304" width="12" height="76" />
            <rect x="106" y="308" width="12" height="72" />
            <rect x="180" y="298" width="12" height="82" />
            <rect x="254" y="306" width="12" height="74" />
            <rect x="328" y="300" width="12" height="80" />
            <rect x="402" y="308" width="12" height="72" />
            <rect x="474" y="298" width="12" height="82" />
          </g>
        </svg>
      </div>
    </section>
  );
}
