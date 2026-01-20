/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zomi: {
          green: '#38b000',
          mint: '#c7f9cc',
          cream: '#fefae0',
        },
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
};
