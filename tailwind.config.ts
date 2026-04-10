import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#0A0E17",
          surface: "#0F1629",
          card: "#131A2E",
          border: "#1E293B",
          "border-light": "#2D3A52",
        },
        accent: {
          green: "#10B981",
          "green-dim": "#065F46",
          amber: "#F59E0B",
          "amber-dim": "#78350F",
          red: "#EF4444",
          "red-dim": "#7F1D1D",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
