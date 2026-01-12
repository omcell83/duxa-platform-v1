"use client";

import React from 'react';
import { motion } from 'framer-motion';

export interface FlagProps {
  countryCode: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

// Language code to country code mapping
const langToCountryCode: Record<string, string> = {
  en: 'gb', // English -> Great Britain (can be changed to 'us' if preferred)
  tr: 'tr',
  de: 'de',
  fr: 'fr',
  nl: 'nl',
  lb: 'lu', // Luxembourgish -> Luxembourg
  me: 'me', // Montenegrin -> Montenegro
  pt: 'pt',
  ru: 'ru',
  it: 'it',
  es: 'es',
  be_nl: 'be', // Belgian Dutch -> Belgium
  at: 'at',
  ch: 'ch',
  rs: 'rs',
  hr: 'hr',
  ba: 'ba',
  al: 'al',
  gr: 'gr',
  bg: 'bg',
  ro: 'ro',
  pl: 'pl',
  se: 'se',
  no: 'no',
  dk: 'dk',
  fi: 'fi',
};

/**
 * Flag Component
 * 
 * Displays a circular country flag with 3D effect and hover animation.
 * 
 * @param countryCode - Country code (e.g., 'tr', 'us', 'gb') or language code (e.g., 'en', 'tr')
 * @param size - Size of the flag in pixels (default: 32)
 * @param className - Additional CSS classes
 * @param onClick - Click handler
 * 
 * @example
 * <Flag countryCode="tr" size={48} />
 * <Flag countryCode="en" size={32} onClick={() => setLang('en')} />
 */
export function Flag({ 
  countryCode, 
  size = 32,
  className = '',
  onClick
}: FlagProps) {
  // Convert language code to country code if needed
  const countryCodeLower = countryCode.toLowerCase();
  const actualCountryCode = langToCountryCode[countryCodeLower] || countryCodeLower;
  const flagPath = `/flags/${actualCountryCode}.svg`;
  
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      whileHover={onClick ? {
        y: -4,
        scale: 1.1,
      } : {}}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {/* 3D Effect Container */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: `
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2)
          `,
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)
          `,
        }}
      >
        {/* Flag Image - Using img tag for public assets */}
        <img
          src={flagPath}
          alt={`${actualCountryCode.toUpperCase()} flag`}
          className="rounded-full object-cover w-full h-full"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
          onError={(e) => {
            // Fallback to GB flag if image fails to load
            const target = e.target as HTMLImageElement;
            const currentSrc = target.src;
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            if (!currentSrc.includes('/flags/gb.svg')) {
              target.src = '/flags/gb.svg';
            }
          }}
        />
        
        {/* Additional shine overlay for 3D effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.5) 0%, transparent 60%)
            `,
          }}
        />
      </div>
    </motion.div>
  );
}
