import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        chat: {
          header: "#1e293b",
          sidebar: "#0f172a",
          background: "#0c1222",
          input: "#1e293b",
          messageOwn: "#1d4ed8",
          messageOther: "#334155",
          accent: "#3b82f6",
          accentHover: "#2563eb",
          online: "#22c55e",
          away: "#f59e0b",
          offline: "#6b7280",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
