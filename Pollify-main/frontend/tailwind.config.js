/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      fontFamily: {
        display: ["'Poppins'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(5, 150, 105, 0.12)",
        card: "0 2px 12px -2px rgba(5, 150, 105, 0.08)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(16,185,129,0)" },
        },
        fillBar: {
          "0%": { width: "0%" },
        },
      },
      animation: {
        pop: "pop 0.25s ease-out",
        pulseGlow: "pulseGlow 2s infinite",
      },
    },
  },
  plugins: [],
};
