import type { Config } from "tailwindcss";

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
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
        muted: "#3d5a4f",
        accent: "#4af59a",
      },
      boxShadow: {
        hero: "0 0 36px rgba(32, 230, 126, 0.28), 0 8px 28px rgba(0, 0, 0, 0.45)",
        "hero-hover": "0 0 56px rgba(32, 230, 126, 0.42), 0 12px 40px rgba(0, 0, 0, 0.55)",
        panel: "0 16px 48px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255,255,255,0.04)",
        glow: "0 0 28px rgba(32, 230, 126, 0.32)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      animation: {
        "aurora-1": "aurora-1 14s ease-in-out infinite",
        "aurora-2": "aurora-2 18s ease-in-out infinite",
        "fade-up": "fade-up 0.55s ease-out both",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float-1": "float-1 5s ease-in-out infinite",
        "float-2": "float-2 7s ease-in-out infinite reverse",
        "float-3": "float-3 6s ease-in-out infinite",
      },
      keyframes: {
        "aurora-1": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.08)" },
          "66%": { transform: "translate(-20px, 28px) scale(0.95)" },
        },
        "aurora-2": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "40%": { transform: "translate(-38px, 55px) scale(1.12)" },
          "70%": { transform: "translate(24px, -28px) scale(0.94)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        "float-1": {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.4" },
          "50%": { transform: "translateY(-35px) translateX(10px) scale(1.3)", opacity: "1" },
        },
        "float-2": {
          "0%, 100%": { transform: "translateY(0) translateX(0) scale(1)", opacity: "0.3" },
          "50%": { transform: "translateY(25px) translateX(-25px) scale(0.8)", opacity: "0.9" },
        },
        "float-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.4" },
          "50%": { transform: "translate(30px, 25px) scale(1.25)", opacity: "1" },
        },
      },
    }
  },
  plugins: []
};

export default config;
