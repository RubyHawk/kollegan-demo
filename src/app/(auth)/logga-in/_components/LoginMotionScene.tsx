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
            {/* Sky: deep steel-blue top → warm peachy-amber at horizon */}
            <linearGradient id="auth-win-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1a2d45" />
              <stop offset="45%"  stopColor="#2e4a6e" />
              <stop offset="75%"  stopColor="#5c7fa3" />
              <stop offset="90%"  stopColor="#b08060" />
              <stop offset="100%" stopColor="#d4956a" />
            </linearGradient>
            {/* Warm horizon glow behind buildings */}
            <radialGradient id="auth-win-horizon" cx="50%" cy="100%" r="60%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#e8a060" stopOpacity="0.55" />
              <stop offset="55%"  stopColor="#c87040" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c87040" stopOpacity="0" />
            </radialGradient>
            {/* Dark wet ground with subtle lighter strip at top */}
            <linearGradient id="auth-win-ground" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#3a4a38" />
              <stop offset="18%"  stopColor="#1e2a1c" />
              <stop offset="100%" stopColor="#111810" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width="560" height="380" fill="url(#auth-win-sky)" />
          {/* Warm horizon radial glow */}
          <rect x="0" y="100" width="560" height="220" fill="url(#auth-win-horizon)" />

          {/* Haze band at horizon ~y=190 */}
          <rect x="0" y="183" width="560" height="18" fill="#8fb0cc" fillOpacity="0.18" />

          {/* Far buildings — taller, thinner, muted steel-blue */}
          <g fill="#4a6882" fillOpacity="0.42">
            <rect x="8"   y="120" width="22" height="280" />
            <rect x="34"  y="95"  width="16" height="305" />
            <rect x="58"  y="138" width="20" height="262" />
            <rect x="82"  y="80"  width="18" height="320" />
            <rect x="104" y="108" width="24" height="292" />
            <rect x="132" y="62"  width="20" height="318" />
            <rect x="156" y="98"  width="16" height="282" />
            <rect x="176" y="75"  width="22" height="305" />
            <rect x="202" y="55"  width="18" height="325" />
            <rect x="228" y="90"  width="20" height="290" />
            <rect x="252" y="70"  width="16" height="310" />
            <rect x="272" y="100" width="22" height="280" />
            <rect x="300" y="60"  width="18" height="320" />
            <rect x="324" y="85"  width="20" height="295" />
            <rect x="350" y="110" width="16" height="270" />
            <rect x="370" y="72"  width="22" height="308" />
            <rect x="398" y="88"  width="18" height="292" />
            <rect x="420" y="55"  width="20" height="325" />
            <rect x="446" y="95"  width="16" height="285" />
            <rect x="466" y="78"  width="22" height="302" />
            <rect x="494" y="62"  width="18" height="318" />
            <rect x="518" y="92"  width="24" height="288" />
            <rect x="544" y="105" width="16" height="275" />
          </g>

          {/* Far building windows — cool white-blue, sparse */}
          <g fill="#cde0f5" fillOpacity="0.28">
            <rect x="86"  y="88"  width="5" height="4" /><rect x="93"  y="88"  width="5" height="4" />
            <rect x="86"  y="98"  width="5" height="4" />
            <rect x="136" y="70"  width="5" height="4" /><rect x="143" y="70"  width="5" height="4" /><rect x="150" y="70"  width="5" height="4" />
            <rect x="136" y="80"  width="5" height="4" /><rect x="150" y="80"  width="5" height="4" />
            <rect x="136" y="90"  width="5" height="4" /><rect x="143" y="90"  width="5" height="4" />
            <rect x="179" y="83"  width="5" height="4" /><rect x="186" y="83"  width="5" height="4" />
            <rect x="206" y="63"  width="5" height="4" /><rect x="213" y="63"  width="5" height="4" /><rect x="220" y="63"  width="5" height="4" />
            <rect x="206" y="73"  width="5" height="4" /><rect x="220" y="73"  width="5" height="4" />
            <rect x="305" y="68"  width="5" height="4" /><rect x="312" y="68"  width="5" height="4" />
            <rect x="305" y="78"  width="5" height="4" /><rect x="312" y="78"  width="5" height="4" /><rect x="319" y="78"  width="5" height="4" />
            <rect x="374" y="80"  width="5" height="4" /><rect x="381" y="80"  width="5" height="4" /><rect x="388" y="80"  width="5" height="4" />
            <rect x="424" y="63"  width="5" height="4" /><rect x="431" y="63"  width="5" height="4" />
            <rect x="424" y="73"  width="5" height="4" /><rect x="431" y="73"  width="5" height="4" /><rect x="438" y="73"  width="5" height="4" />
            <rect x="498" y="70"  width="5" height="4" /><rect x="505" y="70"  width="5" height="4" /><rect x="512" y="70"  width="5" height="4" />
            <rect x="498" y="80"  width="5" height="4" /><rect x="512" y="80"  width="5" height="4" />
          </g>

          {/* Near buildings — darker, wider, shorter */}
          <g fill="#1e2e3e" fillOpacity="0.88">
            <rect x="-4"  y="195" width="55" height="185" />
            <rect x="55"  y="170" width="48" height="210" />
            <rect x="107" y="188" width="42" height="192" />
            <rect x="153" y="155" width="62" height="225" />
            <rect x="219" y="165" width="45" height="215" />
            <rect x="268" y="140" width="70" height="240" />
            <rect x="342" y="162" width="52" height="218" />
            <rect x="398" y="148" width="58" height="232" />
            <rect x="460" y="172" width="44" height="208" />
            <rect x="508" y="158" width="52" height="222" />
          </g>

          {/* Near building windows — warm amber + cool white mix */}
          {/* Amber lit windows */}
          <g fill="#f5c87a" fillOpacity="0.72">
            <rect x="62"  y="178" width="8" height="6" /><rect x="74"  y="178" width="8" height="6" /><rect x="86"  y="178" width="8" height="6" />
            <rect x="62"  y="192" width="8" height="6" /><rect x="86"  y="192" width="8" height="6" />
            <rect x="62"  y="206" width="8" height="6" /><rect x="74"  y="206" width="8" height="6" />
            <rect x="160" y="163" width="9" height="7" /><rect x="173" y="163" width="9" height="7" /><rect x="186" y="163" width="9" height="7" /><rect x="199" y="163" width="9" height="7" />
            <rect x="160" y="178" width="9" height="7" /><rect x="186" y="178" width="9" height="7" /><rect x="199" y="178" width="9" height="7" />
            <rect x="160" y="193" width="9" height="7" /><rect x="173" y="193" width="9" height="7" />
            <rect x="160" y="208" width="9" height="7" /><rect x="186" y="208" width="9" height="7" /><rect x="199" y="208" width="9" height="7" />
            <rect x="275" y="148" width="10" height="7" /><rect x="289" y="148" width="10" height="7" /><rect x="303" y="148" width="10" height="7" /><rect x="317" y="148" width="10" height="7" />
            <rect x="275" y="163" width="10" height="7" /><rect x="303" y="163" width="10" height="7" /><rect x="317" y="163" width="10" height="7" />
            <rect x="275" y="178" width="10" height="7" /><rect x="289" y="178" width="10" height="7" /><rect x="317" y="178" width="10" height="7" />
            <rect x="275" y="193" width="10" height="7" /><rect x="303" y="193" width="10" height="7" />
            <rect x="275" y="208" width="10" height="7" /><rect x="289" y="208" width="10" height="7" /><rect x="303" y="208" width="10" height="7" /><rect x="317" y="208" width="10" height="7" />
            <rect x="406" y="156" width="9" height="7" /><rect x="419" y="156" width="9" height="7" /><rect x="432" y="156" width="9" height="7" /><rect x="445" y="156" width="9" height="7" />
            <rect x="406" y="171" width="9" height="7" /><rect x="432" y="171" width="9" height="7" />
            <rect x="406" y="186" width="9" height="7" /><rect x="419" y="186" width="9" height="7" /><rect x="445" y="186" width="9" height="7" />
            <rect x="406" y="201" width="9" height="7" /><rect x="432" y="201" width="9" height="7" /><rect x="445" y="201" width="9" height="7" />
          </g>
          {/* Cool white-blue windows */}
          <g fill="#d8eeff" fillOpacity="0.55">
            <rect x="113" y="196" width="8" height="6" /><rect x="125" y="196" width="8" height="6" /><rect x="137" y="196" width="8" height="6" />
            <rect x="125" y="210" width="8" height="6" />
            <rect x="227" y="173" width="8" height="6" /><rect x="239" y="173" width="8" height="6" /><rect x="251" y="173" width="8" height="6" />
            <rect x="227" y="187" width="8" height="6" /><rect x="251" y="187" width="8" height="6" />
            <rect x="227" y="201" width="8" height="6" /><rect x="239" y="201" width="8" height="6" />
            <rect x="349" y="170" width="8" height="6" /><rect x="361" y="170" width="8" height="6" /><rect x="373" y="170" width="8" height="6" /><rect x="385" y="170" width="8" height="6" />
            <rect x="349" y="184" width="8" height="6" /><rect x="373" y="184" width="8" height="6" />
            <rect x="349" y="198" width="8" height="6" /><rect x="361" y="198" width="8" height="6" /><rect x="385" y="198" width="8" height="6" />
            <rect x="515" y="165" width="8" height="6" /><rect x="527" y="165" width="8" height="6" /><rect x="539" y="165" width="8" height="6" />
            <rect x="515" y="179" width="8" height="6" /><rect x="539" y="179" width="8" height="6" />
            <rect x="515" y="193" width="8" height="6" /><rect x="527" y="193" width="8" height="6" /><rect x="539" y="193" width="8" height="6" />
          </g>

          {/* Ground reflection band just above main ground */}
          <rect x="0" y="308" width="560" height="12" fill="#4a6070" fillOpacity="0.30" />
          {/* Dark wet ground */}
          <rect x="0" y="318" width="560" height="62" fill="url(#auth-win-ground)" />

          {/* Tree trunks */}
          <g fill="#18140e" fillOpacity="0.80">
            <rect x="65"  y="298" width="8"  height="82" />
            <rect x="155" y="291" width="9"  height="89" />
            <rect x="248" y="294" width="8"  height="86" />
            <rect x="346" y="296" width="9"  height="84" />
            <rect x="448" y="292" width="8"  height="88" />
          </g>

          {/* Trees — 3 stacked ellipses per tree with slight color variation */}
          {/* Tree at x≈69 */}
          <ellipse cx="69"  cy="310" rx="28" ry="20" fill="#1a2518" fillOpacity="0.95" />
          <ellipse cx="69"  cy="293" rx="22" ry="18" fill="#1e2d1a" fillOpacity="0.95" />
          <ellipse cx="69"  cy="278" rx="16" ry="15" fill="#223020" fillOpacity="0.92" />
          {/* Tree at x≈159 */}
          <ellipse cx="159" cy="305" rx="32" ry="22" fill="#1a2518" fillOpacity="0.95" />
          <ellipse cx="159" cy="286" rx="25" ry="20" fill="#1e2d1a" fillOpacity="0.95" />
          <ellipse cx="159" cy="269" rx="18" ry="16" fill="#223020" fillOpacity="0.92" />
          {/* Tree at x≈252 */}
          <ellipse cx="252" cy="308" rx="30" ry="21" fill="#1a2518" fillOpacity="0.95" />
          <ellipse cx="252" cy="289" rx="24" ry="19" fill="#1e2d1a" fillOpacity="0.95" />
          <ellipse cx="252" cy="273" rx="17" ry="15" fill="#223020" fillOpacity="0.92" />
          {/* Tree at x≈350 */}
          <ellipse cx="350" cy="308" rx="31" ry="21" fill="#1a2518" fillOpacity="0.95" />
          <ellipse cx="350" cy="290" rx="25" ry="19" fill="#1e2d1a" fillOpacity="0.95" />
          <ellipse cx="350" cy="274" rx="18" ry="15" fill="#223020" fillOpacity="0.92" />
          {/* Tree at x≈452 */}
          <ellipse cx="452" cy="306" rx="29" ry="20" fill="#1a2518" fillOpacity="0.95" />
          <ellipse cx="452" cy="288" rx="23" ry="18" fill="#1e2d1a" fillOpacity="0.95" />
          <ellipse cx="452" cy="272" rx="16" ry="15" fill="#223020" fillOpacity="0.92" />

          {/* Street lamp — left side */}
          {/* Pole */}
          <rect x="22" y="240" width="3" height="80" fill="#0e1820" fillOpacity="0.90" />
          {/* Arm */}
          <path d="M24 248 Q32 244 34 250" stroke="#0e1820" strokeOpacity="0.90" strokeWidth="2" fill="none" />
          {/* Globe */}
          <ellipse cx="34" cy="251" rx="4" ry="3" fill="#f8e8b0" fillOpacity="0.70" />
        </svg>
      </div>
    </section>
  );
}
