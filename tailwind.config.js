/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B5A5C',
          secondary: '#E06D53',
          neutral: '#FAF8F5',
          text: '#1F1F1F',
        }
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "Inter", "sans-serif"],
        display: ["Be Vietnam Pro", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
