const { nextui } = require('@nextui-org/react')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    // Must be root node_modules
    '../../node_modules/@nextui-org/theme/dist/components/(button|input).js',
  ],
  theme: {
    extend: {
      borderWidth: 1,
      colors: {
        divider: '#fff2',
        foreground: '#ECEFF1',
        background: '#000712',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    nextui({
      defaultTheme: 'dark',
      themes: {
        dark: {
          colors: {
            foreground: {
              50: '#ECEFF1',
              100: '#CFD8DC',
              200: '#B0BEC5',
              300: '#90A4AE',
              400: '#78909C',
              500: '#607D8B',
              600: '#546E7A',
              700: '#455A64',
              800: '#37474F',
              900: '#263238',
            },
            primary: {
              50: '#E0F2F1',
              100: '#B2DFDB',
              200: '#80CBC4',
              300: '#4DB6AC',
              400: '#26A69A',
              500: '#009688',
              600: '#00897B',
              700: '#00796B',
              800: '#00695C',
              900: '#004D40',
            },
            secondary: {
              50: '#F2E0E1',
              100: '#DFB2B6',
              200: '#CB8087',
              300: '#B64D57',
              400: '#A62632',
              500: '#96000E',
              600: '#89000E',
              700: '#79000E',
              800: '#69000D',
              900: '#4D000D',
            },
          },
        },
      },
    }),
  ],
}
