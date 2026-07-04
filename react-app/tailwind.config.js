/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#166534",
        secondary: "#16a34a",
        accent: "#f59e0b",
        live: "#e63946",
        bg: "#f4f6f9",
        surface: "#ffffff",
        text: "#1c2331",
        textMuted: "#6b7280",
        border: "#e2e5eb",
        "app-bg": "000000",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        app: "0 2px 10px rgba(15, 23, 42, 0.07)",
      },
      maxWidth: {
        shell: "430px",
      },
    },
  },
  plugins: [],
};
