interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function TrendalyzLogo({ size = 'md', showText = true, showSubtitle = false, className = '' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'md' ? 38 : 52;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-3xl';
  const subtitleSize = size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[9px]' : 'text-xs';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Bar gradients - light to dark blue */}
          <linearGradient id="tl-bar1" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#b8dce8" />
            <stop offset="100%" stopColor="#8ec8d8" />
          </linearGradient>
          <linearGradient id="tl-bar2" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#7dbfcf" />
            <stop offset="100%" stopColor="#4da8bf" />
          </linearGradient>
          <linearGradient id="tl-bar3" x1="0" y1="100" x2="0" y2="0">
            <stop offset="0%" stopColor="#1a6b8a" />
            <stop offset="100%" stopColor="#0d3b5e" />
          </linearGradient>
          {/* Background gradient */}
          <linearGradient id="tl-bg" x1="0" y1="100" x2="100" y2="0">
            <stop offset="0%" stopColor="#d4eef5" />
            <stop offset="100%" stopColor="#a8d8e8" />
          </linearGradient>
        </defs>
        {/* Background square */}
        <rect x="10" y="10" width="80" height="80" rx="4" fill="url(#tl-bg)" />
        {/* Three bars - ascending */}
        <rect x="20" y="52" width="18" height="32" rx="1" fill="url(#tl-bar1)" />
        <rect x="41" y="35" width="18" height="49" rx="1" fill="url(#tl-bar2)" />
        <rect x="62" y="14" width="18" height="70" rx="1" fill="url(#tl-bar3)" />
        {/* Upward arrow - white diagonal */}
        <line x1="16" y1="78" x2="76" y2="20" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <polyline points="62,18 76,20 74,34" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSize} font-black tracking-tight uppercase`} style={{ color: '#0d3b5e' }}>
            <span className="dark:text-[#a8d8e8]">Trend</span><span className="dark:text-[#4da8bf]" style={{ color: '#1a6b8a' }}>alyz</span>
          </span>
          {showSubtitle && (
            <span className={`${subtitleSize} font-semibold tracking-[0.15em] uppercase dark:text-[#7dbfcf]`} style={{ color: '#1a6b8a' }}>
              Data Analytics Solutions
            </span>
          )}
        </div>
      )}
    </div>
  );
}
