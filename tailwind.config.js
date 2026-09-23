/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1a17',
        paper: '#faf6f0',
        clay: '#a9673f',
        moss: '#4f5d47',
        sand: '#e6dcc8',
        navy: '#031d29',
        gold: '#e5a914',
        'gold-light': '#f4c63d',
        body: '#151820',
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Poppins"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
