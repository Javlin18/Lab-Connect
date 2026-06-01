/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#F2F4F7",
        line: "#D0D5DD",
        brand: {
          DEFAULT: "#0F766E",
          soft: "#CCFBF1",
          deep: "#134E4A"
        },
        accent: "#F97316",
        success: "#15803D",
        danger: "#B42318"
      }
    }
  },
  plugins: []
};
