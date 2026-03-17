export const typography = {
  h1: {
    fontFamily: 'ChocolatesBold',
    fontSize: 28,
    lineHeight: 36,
  },
  h2: {
    fontFamily: 'ChocolatesBold',
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'ChocolatesMedium',
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'ChocolatesRegular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'ChocolatesRegular',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'ChocolatesRegular',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'ChocolatesMedium',
    fontSize: 16,
    lineHeight: 24,
  },
} as const;

export type TypographyKey = keyof typeof typography;
