import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        line: "var(--line)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        ok: "var(--ok)",
        "ok-soft": "var(--ok-soft)",
        warn: "var(--warn)",
        "warn-soft": "var(--warn-soft)",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
