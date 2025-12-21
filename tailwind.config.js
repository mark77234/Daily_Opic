/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#EDE9FF',
          200: '#DAD1FF',
          300: '#B7A6FF',
          400: '#8C76F6',
          500: '#684AE9',
          600: '#512FE2',
        },
      },
    },
  },
  plugins: [],
};
