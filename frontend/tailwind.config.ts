import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        institutional: {
          navy: '#13233f',
          gold: '#d8aa3f',
          surface: '#f7f5ef'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
