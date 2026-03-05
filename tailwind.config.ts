import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#030806",
        panel: "#0a1712",
        brand: "#20e67e",
        brandDark: "#15b663",
        brandBright: "#9bffcb",
        ink: "#ebfff3",
        soft: "#9cb8ab",
        accent: "#4af59a"
      },
      boxShadow: {
        hero: "0 18px 50px rgba(32, 230, 126, 0.2)",
        panel: "0 12px 34px rgba(0, 0, 0, 0.42)"
      },
      fontFamily: {
        sans: [
          "Space Grotesk",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
