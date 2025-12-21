/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#111827", // Dark background
          surface: "#1F2937", // Dark surface
          text: "#F9FAFB", // Light text
        },
      },
    },
  },
  plugins: [],
}

