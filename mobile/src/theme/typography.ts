import { TextStyle } from 'react-native';

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 28,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    lineHeight: 36,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: 28,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: 24,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
    color: '#666666',
  },
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
  },
} as const satisfies Record<string, TextStyle>;
