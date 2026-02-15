'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function TrendalyzLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'md' ? 32 : 44;
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-3xl';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient defs */}
        <defs>
          <linearGradient id="trendalyz-grad" x1="0" y1="48" x2="48" y2="0">
            <stop offset="0%" stopColor="var(--accent, #6366f1)" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="48" height="48" rx="12" fill="url(#trendalyz-grad)" />
        {/* Trend line going up */}
        <polyline
          points="10,34 18,26 24,30 38,14"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Arrow head */}
        <polyline
          points="31,14 38,14 38,21"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Small dot at start */}
        <circle cx="10" cy="34" r="2.5" fill="white" opacity="0.6" />
      </svg>
      {showText && (
        <span className={`${textSize} font-extrabold tracking-tight text-[var(--text-primary)]`}>
          Trend<span className="text-[var(--accent)]">alyz</span>
        </span>
      )}
    </div>
  );
}
