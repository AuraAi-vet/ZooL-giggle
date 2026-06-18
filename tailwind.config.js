/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ruru-teal': 'rgb(var(--ruru-teal) / <alpha-value>)',
        'ruru-magenta': 'rgb(var(--ruru-magenta) / <alpha-value>)',
        'surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'ruru-teal-pale': '#8ebbc4',
        'ruru-navy': '#0B1424',
        'ruru-navy-light': '#1e293b'
      },
      fontFamily: {
        brand: ["var(--font-brand)", "Fredoka", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["Outfit", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
