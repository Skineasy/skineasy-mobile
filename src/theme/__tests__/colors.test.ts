import { describe, it, expect } from 'vitest';
import { colors } from '@theme/colors';

describe('colors', () => {
  it('should have primary color defined', () => {
    expect(colors.primary).toBe('#7D604E');
  });

  it('should have background color defined', () => {
    expect(colors.background).toBe('#F4E9E0');
  });

  it('should have all required color keys', () => {
    const requiredKeys = [
      'primary',
      'primaryDark',
      'secondary',
      'background',
      'surface',
      'text',
      'textMuted',
      'error',
      'success',
      'warning',
      'border',
      'cream',
      'creamMuted',
      'brownDark',
      'brownLight',
    ];

    requiredKeys.forEach((key) => {
      expect(colors).toHaveProperty(key);
    });
  });
});
