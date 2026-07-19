/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16A34A', 700: '#15803d',
          800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        secondary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563EB', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        accent: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#F59E0B', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.08)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.10)',
        float: '0 12px 40px -12px rgba(0,0,0,0.18)',
        glow: '0 0 0 1px rgba(22,163,74,0.12), 0 8px 30px -8px rgba(22,163,74,0.25)',
      },
      borderRadius: {
        '2xl': '1rem', '3xl': '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, y: 8 }, to: { opacity: 1, y: 0 } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'shimmer': { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
