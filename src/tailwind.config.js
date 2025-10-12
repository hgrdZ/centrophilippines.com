/** @type {import('tailwindcss').Config} */ 
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
        gilroy: ["Gilroy", "ui-sans-serif", "system-ui"],
        avenir: ["Avenir", "ui-sans-serif", "system-ui"],
        montserrat: ["Montserrat", "ui-sans-serif", "system-ui"], 

      },
    },
  },
  plugins: [],
}
