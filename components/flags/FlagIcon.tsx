"use client";

import React from 'react';

// Country flag imports
import US from 'country-flag-icons/react/3x2/US';
import TR from 'country-flag-icons/react/3x2/TR';
import DE from 'country-flag-icons/react/3x2/DE';
import FR from 'country-flag-icons/react/3x2/FR';
import LU from 'country-flag-icons/react/3x2/LU';
import ME from 'country-flag-icons/react/3x2/ME';
import PT from 'country-flag-icons/react/3x2/PT';
import NL from 'country-flag-icons/react/3x2/NL';
import RU from 'country-flag-icons/react/3x2/RU';
import GB from 'country-flag-icons/react/3x2/GB';
import ES from 'country-flag-icons/react/3x2/ES';
import IT from 'country-flag-icons/react/3x2/IT';
import PL from 'country-flag-icons/react/3x2/PL';
import GR from 'country-flag-icons/react/3x2/GR';
import RO from 'country-flag-icons/react/3x2/RO';
import BG from 'country-flag-icons/react/3x2/BG';
import HR from 'country-flag-icons/react/3x2/HR';
import RS from 'country-flag-icons/react/3x2/RS';
import BA from 'country-flag-icons/react/3x2/BA';
import MK from 'country-flag-icons/react/3x2/MK';
import AL from 'country-flag-icons/react/3x2/AL';
import XK from 'country-flag-icons/react/3x2/XK';
import SI from 'country-flag-icons/react/3x2/SI';
import HU from 'country-flag-icons/react/3x2/HU';
import CZ from 'country-flag-icons/react/3x2/CZ';
import SK from 'country-flag-icons/react/3x2/SK';
import AT from 'country-flag-icons/react/3x2/AT';
import CH from 'country-flag-icons/react/3x2/CH';
import BE from 'country-flag-icons/react/3x2/BE';
import IE from 'country-flag-icons/react/3x2/IE';
import DK from 'country-flag-icons/react/3x2/DK';
import SE from 'country-flag-icons/react/3x2/SE';
import NO from 'country-flag-icons/react/3x2/NO';
import FI from 'country-flag-icons/react/3x2/FI';
import IS from 'country-flag-icons/react/3x2/IS';
import EE from 'country-flag-icons/react/3x2/EE';
import LV from 'country-flag-icons/react/3x2/LV';
import LT from 'country-flag-icons/react/3x2/LT';
import UA from 'country-flag-icons/react/3x2/UA';
import BY from 'country-flag-icons/react/3x2/BY';
import MD from 'country-flag-icons/react/3x2/MD';

// Language code to country code mapping
const langToCountryCode: Record<string, React.ComponentType<any>> = {
  en: US,  // English -> US (can be changed to GB if preferred)
  tr: TR,  // Turkish -> Turkey
  de: DE,  // German -> Germany
  fr: FR,  // French -> France
  lb: LU,  // Luxembourgish -> Luxembourg
  me: ME,  // Montenegrin -> Montenegro
  pt: PT,  // Portuguese -> Portugal
  nl: NL,  // Dutch -> Netherlands
  ru: RU,  // Russian -> Russia
  // Additional languages (ready for future expansion)
  es: ES,  // Spanish -> Spain
  it: IT,  // Italian -> Italy
  pl: PL,  // Polish -> Poland
  gr: GR,  // Greek -> Greece
  ro: RO,  // Romanian -> Romania
  bg: BG,  // Bulgarian -> Bulgaria
  hr: HR,  // Croatian -> Croatia
  sr: RS,  // Serbian -> Serbia
  ba: BA,  // Bosnian -> Bosnia
  mk: MK,  // Macedonian -> North Macedonia
  sq: AL,  // Albanian -> Albania
  xk: XK,  // Kosovan -> Kosovo
  sl: SI,  // Slovenian -> Slovenia
  hu: HU,  // Hungarian -> Hungary
  cs: CZ,  // Czech -> Czech Republic
  sk: SK,  // Slovak -> Slovakia
  at: AT,  // Austrian German -> Austria
  ch: CH,  // Swiss German/French/Italian -> Switzerland
  be: BE,  // Belgian -> Belgium
  ga: IE,  // Irish -> Ireland
  da: DK,  // Danish -> Denmark
  sv: SE,  // Swedish -> Sweden
  no: NO,  // Norwegian -> Norway
  fi: FI,  // Finnish -> Finland
  is: IS,  // Icelandic -> Iceland
  et: EE,  // Estonian -> Estonia
  lv: LV,  // Latvian -> Latvia
  lt: LT,  // Lithuanian -> Lithuania
  uk: UA,  // Ukrainian -> Ukraine
  be_by: BY, // Belarusian -> Belarus
  ro_md: MD, // Moldovan -> Moldova
};

export interface FlagIconProps {
  langCode: string;
  className?: string;
  size?: number | string;
  circular?: boolean;
}

/**
 * FlagIcon Component
 * 
 * Displays country flags based on language codes.
 * Flags are rendered as perfect circles when circular prop is true.
 * 
 * @param langCode - Language code (e.g., 'tr', 'en', 'de')
 * @param className - Additional CSS classes
 * @param size - Size of the flag (number for pixels, or string like '48px', '3rem')
 * @param circular - Whether to render as a perfect circle (default: true)
 * 
 * @example
 * <FlagIcon langCode="tr" size={48} />
 * <FlagIcon langCode="en" size="3rem" circular={true} />
 */
export function FlagIcon({ 
  langCode, 
  className = '', 
  size = 48,
  circular = true 
}: FlagIconProps) {
  const FlagComponent = langToCountryCode[langCode];
  
  if (!FlagComponent) {
    // Fallback to US flag if language not found
    const FallbackFlag = langToCountryCode['en'];
    return (
      <div 
        className={`inline-flex items-center justify-center ${circular ? 'rounded-full overflow-hidden' : ''} ${className}`}
        style={{ 
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
        }}
      >
        <FallbackFlag 
          className="w-full h-full"
          style={circular ? { clipPath: 'circle(50% at 50% 50%)' } : {}}
        />
      </div>
    );
  }

  const sizeStyle = typeof size === 'number' 
    ? { width: `${size}px`, height: `${size}px` }
    : { width: size, height: size };

  return (
    <div 
      className={`inline-flex items-center justify-center ${circular ? 'rounded-full overflow-hidden' : ''} ${className}`}
      style={sizeStyle}
    >
      <FlagComponent 
        className="w-full h-full"
        style={circular ? { clipPath: 'circle(50% at 50% 50%)' } : {}}
      />
    </div>
  );
}

/**
 * Get available language codes
 */
export function getAvailableLanguageCodes(): string[] {
  return Object.keys(langToCountryCode);
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(langCode: string): boolean {
  return langCode in langToCountryCode;
}
