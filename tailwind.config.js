/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          light: 'rgb(var(--color-text-light) / <alpha-value>)',
        },
        error: 'rgb(var(--color-error) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
        },
        cream: {
          DEFAULT: 'rgb(var(--color-cream) / <alpha-value>)',
          muted: 'rgb(var(--color-cream-muted) / <alpha-value>)',
        },
        brown: {
          dark: 'rgb(var(--color-brown-dark) / <alpha-value>)',
          light: 'rgb(var(--color-brown-light) / <alpha-value>)',
        },
      },
      fontFamily: {
        normal: ['ChocolatesRegular'],
        medium: ['ChocolatesMedium'],
        semibold: ['ChocolatesSemibold'],
        bold: ['ChocolatesBold'],
      },
      fontSize: {
        // Override default font sizes to use 1.2 line height for Chocolates font
        xs: ['0.75rem', { lineHeight: '0.9rem' }],
        sm: ['0.875rem', { lineHeight: '1.05rem' }],
        base: ['1rem', { lineHeight: '1.2rem' }],
        lg: ['1.125rem', { lineHeight: '1.35rem' }],
        xl: ['1.25rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.8rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.7rem' }],
        '5xl': ['3rem', { lineHeight: '3.6rem' }],
        '6xl': ['3.75rem', { lineHeight: '4.5rem' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
