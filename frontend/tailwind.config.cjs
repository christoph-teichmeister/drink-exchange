const defaultTheme = require('tailwindcss/defaultTheme');
const skeletonTailwind = require('@skeletonlabs/skeleton/tailwind/skeleton.cjs');

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{svelte,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        market: {
          primary: 'var(--market-primary)',
          accent: 'var(--market-accent)',
          surface: 'var(--market-surface)',
          muted: 'var(--market-muted)',
          highlight: 'var(--market-highlight)'
        }
      }
    }
  },
  plugins: [...skeletonTailwind()]
};
