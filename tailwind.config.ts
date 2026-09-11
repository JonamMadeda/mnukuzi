/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary: deep navy for main actions and brand marks.
        primary: {
          DEFAULT: "#000047",
          dark: "#000033",
          light: "#23237E",
        },
        // Accent: coral for highlights, icon chips, and focus states.
        brand: {
          50: "#FFF4EF",
          100: "#FFE6DB",
          200: "#FFC9B3",
          500: "#FF6A45",
          600: "#F04E23",
          700: "#C93E18",
        },
      },
    },
  },
  plugins: [],
};
