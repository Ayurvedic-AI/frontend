/**
 * Minimal country list used by `CountryCodeAutocomplete`. The dataset is
 * intentionally small (top common entries); consumers can pass their own
 * `countries` prop to render a larger list.
 *
 * `code` is the dial code (returned as the form value).
 * `flag` is an emoji rather than an image asset for zero-network rendering.
 */
export interface CountryCode {
  iso2: string;
  code: string;
  name: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  { iso2: 'US', code: '+1', name: 'United States', flag: '🇺🇸' },
  { iso2: 'CA', code: '+1', name: 'Canada', flag: '🇨🇦' },
  { iso2: 'GB', code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { iso2: 'IE', code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { iso2: 'IN', code: '+91', name: 'India', flag: '🇮🇳' },
  { iso2: 'AU', code: '+61', name: 'Australia', flag: '🇦🇺' },
  { iso2: 'NZ', code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { iso2: 'DE', code: '+49', name: 'Germany', flag: '🇩🇪' },
  { iso2: 'FR', code: '+33', name: 'France', flag: '🇫🇷' },
  { iso2: 'IT', code: '+39', name: 'Italy', flag: '🇮🇹' },
  { iso2: 'ES', code: '+34', name: 'Spain', flag: '🇪🇸' },
  { iso2: 'NL', code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { iso2: 'SE', code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { iso2: 'NO', code: '+47', name: 'Norway', flag: '🇳🇴' },
  { iso2: 'JP', code: '+81', name: 'Japan', flag: '🇯🇵' },
  { iso2: 'KR', code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { iso2: 'CN', code: '+86', name: 'China', flag: '🇨🇳' },
  { iso2: 'SG', code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { iso2: 'AE', code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { iso2: 'BR', code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { iso2: 'MX', code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { iso2: 'ZA', code: '+27', name: 'South Africa', flag: '🇿🇦' },
];
