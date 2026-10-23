import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030814',
          900: '#060f20',
          800: '#0a1a33',
          700: '#102b4f',
        },
        electric: '#2f6bff',
        cyan: {
          glow: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(34, 211, 238, 0.55)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-480px 0' },
          '100%': { backgroundPosition: '480px 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        fadeUp: 'fadeUp 0.45s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
