/** @type {import('tailwindcss').Config} */
/**
 * Charte graphique ODC Academy (maquettes) :
 * Orange core colors follow Orange's digital palette; orange text uses a darker accessible shade.
 */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Le système typographique Orange n'a que deux graisses : 55 Roman (400) et 75 Bold (700).
      // Toute autre graisse est ramenée à la plus proche : plus de faux gras ni de graisse intermédiaire.
      fontWeight: { light: '400', medium: '400', semibold: '700', extrabold: '700', black: '700' },
      colors: {
        odc: {
          orange: '#C45100',
          'orange-dark': '#A64100',
          'orange-light': '#FFF3E8',
          'brand-orange': '#FF7900',
          black: '#111111',
          navy: '#222222',
          gray: '#F7F7F7',
          muted: '#595959',
        },
      },
      fontFamily: {
        sans: ['"ODC Helvetica"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"ODC Helvetica"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 28px rgba(17, 17, 17, 0.07)',
      },
    },
  },
  plugins: [],
};
