'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type LogoVariant = 'icon' | 'horizontal' | 'stacked';
type LogoTheme = 'light' | 'dark' | 'auto';

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  className?: string;
  showText?: boolean;
}

export function Logo({ 
  variant = 'icon', 
  theme = 'auto',
  className,
  showText = false 
}: LogoProps) {
  const { theme: systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should use dark colors
  // For SSR, default to light theme, then update on mount
  const isDark = theme === 'dark' || (theme === 'auto' && mounted && systemTheme === 'dark');
  const textColor = isDark ? '#ffffff' : '#101622';

  // Icon-only variant (default for small spaces)
  if (variant === 'icon') {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-primary", className)}
        aria-label="XpenseLab Logo"
        role="img"
      >
        <defs>
          <linearGradient id="gradient-icon1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="gradient-icon2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#0d59f2",stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
          </linearGradient>
        </defs>
        <g transform="translate(16, 16)">
          <rect x="-1.4" y="-11.5" width="2.8" height="23" rx="1.4" fill="url(#gradient-icon1)" transform="rotate(35)" />
          <rect x="-1.4" y="-9.2" width="2.8" height="18.4" rx="1.4" fill="url(#gradient-icon2)" transform="rotate(-35)" opacity="0.9" />
        </g>
      </svg>
    );
  }

  // Horizontal variant (for navigation bars, headers)
  if (variant === 'horizontal') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
          aria-label="XpenseLab Logo"
          role="img"
        >
          <defs>
            <linearGradient id="gradient-h1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="gradient-h2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:"#0d59f2",stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
            </linearGradient>
          </defs>
          <g transform="translate(16, 16)">
            <rect x="-1.4" y="-11.5" width="2.8" height="23" rx="1.4" fill="url(#gradient-h1)" transform="rotate(35)" />
            <rect x="-1.4" y="-9.2" width="2.8" height="18.4" rx="1.4" fill="url(#gradient-h2)" transform="rotate(-35)" opacity="0.9" />
          </g>
        </svg>
        {showText && (
          <>
            <div className="h-6 w-px bg-border opacity-50" />
            <span 
              className="text-xl font-bold tracking-tight lowercase"
              style={{ color: textColor, letterSpacing: '-0.033em', fontFamily: 'Manrope, sans-serif' }}
            >
              xpenselab
            </span>
          </>
        )}
      </div>
    );
  }

  // Stacked variant (for hero sections, marketing)
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="XpenseLab Logo"
        role="img"
      >
        <defs>
          <linearGradient id="gradient-s1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="gradient-s2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#2563eb",stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#0d59f2",stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#10b981",stopOpacity:1}} />
          </linearGradient>
        </defs>
        <g transform="translate(16, 16)">
          <rect x="-1.4" y="-11.5" width="2.8" height="23" rx="1.4" fill="url(#gradient-s1)" transform="rotate(35)" />
          <rect x="-1.4" y="-9.2" width="2.8" height="18.4" rx="1.4" fill="url(#gradient-s2)" transform="rotate(-35)" opacity="0.9" />
        </g>
      </svg>
      {showText && (
        <span 
          className="text-2xl font-bold tracking-tight lowercase"
          style={{ color: textColor, letterSpacing: '-0.033em', fontFamily: 'Manrope, sans-serif' }}
        >
          xpenselab
        </span>
      )}
    </div>
  );
}
