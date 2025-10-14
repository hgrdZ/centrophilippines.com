/** @type {import('tailwindcss').Config} */ 
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'grid',
    'grid-cols-1',
    'md:grid-cols-2',
    'gap-4',
    'gap-6',
    'gap-8',
    'flex',
    'flex-col',
    'w-full',
    'items-center',
    'justify-between',
    'rounded',
    'px-3',
    'px-4',
    'py-2',
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
