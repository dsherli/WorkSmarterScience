/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  safelist: [
    { pattern: /ring-(blue|green|yellow|purple)-(400|500|600)/ },
    { pattern: /ring-offset-(1|2|4)/ },
    { pattern: /text-(teal|cyan)-(500|600)/, variants: ['group-hover'] },
  ],

  theme: {
    extend: {
      colors: {
        background: '#f9fafb',
        foreground: '#0f172a',
        card: '#ffffff',
        'card-foreground': '#0f172a',
        accent: '#f0f9ff',
        'accent-foreground': '#1e3a8a',
      },
      transitionDuration: {
        300: '300ms',
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
