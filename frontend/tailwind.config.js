/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', '"Nunito"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        mint: {
          50: '#f0fdf9',
          100: '#d9f8ec',
          200: '#b8efda',
          300: '#86e0c0',
          400: '#4ecaa0',
          500: '#2cae84',
          600: '#1f8e6c',
          700: '#1c7258',
          800: '#1a5a48',
          900: '#164a3c',
        },
        lilac: {
          50: '#f8f6ff',
          100: '#efe9ff',
          200: '#e0d4ff',
          300: '#cab4ff',
          400: '#b089ff',
          500: '#9a6bf5',
          600: '#8a4ee8',
          700: '#7c3dd6',
          800: '#6632af',
          900: '#542c8d',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf5ec',
          200: '#f3e9d3',
          300: '#ead8b4',
          400: '#dcc08a',
          500: '#cda863',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0bac9',
          400: '#8595ab',
          500: '#677891',
          600: '#52617a',
          700: '#434f63',
          800: '#3a4453',
          900: '#343c47',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(76, 110, 100, 0.12), 0 2px 8px -4px rgba(76, 110, 100, 0.08)',
        card: '0 8px 30px -10px rgba(76, 110, 100, 0.15), 0 4px 12px -6px rgba(76, 110, 100, 0.08)',
        glow: '0 0 0 4px rgba(44, 174, 132, 0.12)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pop': 'pop 0.4s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
