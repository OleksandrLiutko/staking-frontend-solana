/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#37012B",
        primarybg: "#290120",
        "subtitle-dark": "#ababab",
        "subtitle-light": "#8B8B8B",
        "title-light": "#231507",
        "primary-bg": "#fff9f4",
        "primary-dark-bg": "#231507",
        "secondary-bg": "#FFFFFF",
        "secondary-dark-bg": "#3A2619",
      },
      fontFamily: {
        openSans: ["Open Sans"],
      },
      backgroundImage: {
        btngrad: "linear-gradient(87.03deg, #1EF1A5 -0.04%, #9746FE 99.96%)",
        tabgrad: "linear-gradient(90deg, #22EAA8 2.04%, #944AFC 100%)",
        "wavy-bottom": "url('/images/wavy-bottom.png')",
      },
      boxShadow: {
        custom: "0px 4px 14px rgba(56, 34, 12, 0.1)",
      },
      backgroundColor: {
        lightBrown: "#3A2619",
      },
    },
  },
  plugins: [],
};
