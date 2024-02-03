/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        text: `DM Sans, sans-serif`,
        interface: `Rubik, sans-serif`,
      },
      colors: {
        sigma: {
          100: '#7700b2',
          200: '#8900cb',
          300: '#9a00e3',
          400: '#b00dfe',
          500: '#b41cfd',
          600: '#be38fd',
          700: '#ce65fe',
          800: '#df9cff',
          900: '#f1cfff',
          1000: '#fbe9ff',
        },
      },
    },
  },
  plugins: [],
}

// eslint-disable-next-line import/no-default-export
export default config
