/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        surface: '#111113',
        elevated: '#18181B',
        border: '#27272A',
        text: '#FAFAFA',
        secondary: '#A1A1AA',
        tertiary: '#71717A',
        cyan: '#22D3EE',
        violet: '#A78BFA',
        green: '#34D399',
        yellow: '#FBBF24',
        danger: '#F87171',
      },
      boxShadow: {
        cyan: '0 0 18px rgba(34, 211, 238, 0.25)',
        violet: '0 0 18px rgba(167, 139, 250, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
