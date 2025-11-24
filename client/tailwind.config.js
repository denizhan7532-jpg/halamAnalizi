/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wisteria: '#BDA0E8',
        'dusk-dark': '#505C7C',
        'dusk-navy': '#344C6B',
        'baltic-blue': '#375B86',
        glaucous: '#707DA8',
      },
    },
  },
  plugins: [],
};
