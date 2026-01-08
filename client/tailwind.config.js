/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        caixa: {
          blue: '#003399',
          orange: '#F05A28',
        },
        lottery: {
          megasena: '#209869',
          lotofacil: '#930089',
          quina: '#260085',
          lotomania: '#F78100',
        },
      },
    },
  },
  plugins: [],
};
