interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function TrendalyzLogo({ size = 'md', showText = true, showSubtitle = false, className = '' }: LogoProps) {
  const iconSize = size === 'sm' ? 32 : size === 'md' ? 42 : 58;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-3xl';
  const subtitleSize = size === 'sm' ? 'text-[7px]' : size === 'md' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tl-bg" x1="0" y1="120" x2="120" y2="0">
            <stop offset="0%" stopColor="#b8dce8" />
            <stop offset="100%" stopColor="#8ec8d8" />
          </linearGradient>
          <linearGradient id="tl-bar1" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#9dd3e0" />
            <stop offset="100%" stopColor="#7dc5d5" />
          </linearGradient>
          <linearGradient id="tl-bar2" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#5eb3c8" />
            <stop offset="100%" stopColor="#3a9db5" />
          </linearGradient>
          <linearGradient id="tl-bar3" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#1a6b8a" />
            <stop offset="100%" stopColor="#0d3b5e" />
          </linearGradient>
        </defs>
        {/* Background square */}
        <rect x="6" y="6" width="108" height="108" rx="8" fill="url(#tl-bg)" />
        {/* Three ascending bars */}
        <rect x="18" y="62" width="24" height="40" rx="2" fill="url(#tl-bar1)" />
        <rect x="48" y="40" width="24" height="62" rx="2" fill="url(#tl-bar2)" />
        <rect x="78" y="16" width="24" height="86" rx="2" fill="url(#tl-bar3)" />
        {/* Upward trend arrow */}
        <line x1="14" y1="98" x2="94" y2="22" stroke="white" strokeWidth="7" strokeLinecap="round" />
        <polyline points="76,18 94,22 90,40" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSize} font-black tracking-tight uppercase leading-tight`}>
            <span className="text-[#0d3b5e] dark:text-[#b8dce8]">TREND</span><span className="text-[#1a6b8a] dark:text-[#4da8bf]">ALYZ</span>
          </span>
          {showSubtitle && (
            <span className={`${subtitleSize} font-bold tracking-[0.12em] uppercase text-[#1a6b8a] dark:text-[#7dbfcf] leading-tight`}>
              Data Analytics Solutions
            </span>
          )}
        </div>
      )}
    </div>
  );
}
