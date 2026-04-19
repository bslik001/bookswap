// Palette alignee sur les maquettes (theme clair).
// Dark mode hors-scope MVP (cf. CAHIER_CONCEPTION_FRONTEND.md §1.3).

export const colors = {
  primary: '#4A90D9',
  primaryDark: '#3A7AB8',
  primaryLight: '#6BA3E0',

  bg: '#F5F5F5',
  surface: '#FFFFFF',
  inputBg: '#FFFFFF',

  text: '#1A1A1A',
  textMuted: '#666666',
  textInverse: '#FFFFFF',

  border: '#E0E0E0',
  borderFocus: '#4A90D9',

  chipBg: '#E8F0FE',
  chipText: '#4A90D9',
  badgeUnread: '#E8F0FE',

  success: '#28A745',
  successBg: '#D4EDDA',
  warning: '#E68A00',
  warningBg: '#FFF3E0',
  danger: '#D9534F',
  dangerBg: '#FDECEA',
} as const;

export type ColorName = keyof typeof colors;
