/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,jsx}" // Added this because your files are in the root
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
