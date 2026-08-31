import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Volcanic Charcoal & Grounding Surface Hierarchy
        canvas: "#0E0E11",
        card: "#16161A",
        surface: "#16161A",
        interaction: "#1C1D22",
        panel: "#16161A",
        elevated: "#1C1D22",
        // Primary Warm Somatic Amber / Sunlight Ochre
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
      },
      boxShadow: {
        "amber-glow": "0 0 25px rgba(245,158,11,0.15)",
        "amber-glow-lg": "0 0 35px rgba(245,158,11,0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "somatic-breathe": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
