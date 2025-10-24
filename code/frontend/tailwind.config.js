/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
    },
  },
  plugins: [],
};
