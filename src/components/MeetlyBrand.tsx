import React from 'react';

interface MeetlyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const MeetlyLogoIcon: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center bg-black text-white dark:bg-white dark:text-slate-950 shadow-xs ring-1 ring-black/10 dark:ring-white/20 shrink-0 ${sizeClasses} ${className}`}
    >
      {/* Bespoke Geometric Meetly Aperture Logo */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${svgSizes} text-white dark:text-slate-950`}
      >
        {/* Left meeting node arc */}
        <path
          d="M4 16V9C4 6.79086 5.79086 5 8 5C10.2091 5 12 6.79086 12 9V17"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Right meeting node arc forming an interlocking M */}
        <path
          d="M12 17V9C12 6.79086 13.7909 5 16 5C18.2091 5 20 6.79086 20 9V16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Peer meeting connection points */}
        <circle cx="8" cy="11" r="1.5" fill="currentColor" />
        <circle cx="16" cy="11" r="1.5" fill="currentColor" />
        <circle cx="12" cy="17" r="1.5" fill="#38bdf8" />
      </svg>
    </div>
  );
};

export const MeetlyBrand: React.FC<MeetlyLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <MeetlyLogoIcon size={size} />
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          {/* Distinctive Brand Black Word - Strictly black across the entire platform */}
          <span className={`font-black tracking-tight text-black dark:text-black dark:bg-white dark:px-1.5 dark:py-0.5 dark:rounded-md dark:shadow-xs select-none ${textSizes}`}>
            Meetly
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-800">
            P2P
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden xs:block">
            Decentralized Video Mesh
          </span>
        )}
      </div>
    </div>
  );
};
