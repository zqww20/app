/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F5F7",
        panel: "#FFFFFF",
        ink: "#16212E",
        sub: "#5B6776",
        faint: "#8A93A0",
        line: "#E2E6EC",
        stamp: "#8A2F33",
        green: "#1C7A52",
        amber: "#A8671C",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
