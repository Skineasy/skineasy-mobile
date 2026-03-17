export const colors = {
  // Primary
  primary: '#7D604E',
  primaryDark: '#2E2319',

  // Secondary
  secondary: '#E84C3F',

  // Background
  background: '#F4E9E0',
  surface: '#FFF9F5',

  // Text
  text: '#6B5544',
  textMuted: '#9A8A7A',
  textLight: '#C4B5A8',

  // Semantic
  error: '#E84C3F',
  success: '#17B26A',
  warning: '#FF977E',

  // Border
  border: '#E0C9B8',
  borderFocus: '#17B26A',

  // Brown gradient background
  cream: '#F4E9E0',
  creamMuted: '#E0C9B8',
  brownDark: '#2E2319',
  brownLight: '#7D604E',

  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;
