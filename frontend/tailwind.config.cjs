const defaultTheme = require('tailwindcss/defaultTheme');

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
          primary: '#28c07f',
          accent: '#ffbf69',
          surface: '#05060e',
          muted: '#3f4b66',
          highlight: '#f65c78'
        }
      }
    }
  },
  plugins: []
};
