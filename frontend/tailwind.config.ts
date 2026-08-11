import type { Config } from "tailwindcss";

// Helper: wraps a CSS variable in the rgb() channel syntax Tailwind v3 needs
// so opacity modifiers like bg-midnight/20 work correctly.
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)",    "system-ui", "sans-serif"],
        serif:   ["var(--font-serif)",    "Georgia",   "serif"],
        display: ["var(--font-display)",  "Georgia",   "serif"],
      },
      colors: {
        midnight: {
          DEFAULT: c("--color-primary"),
          dark:    c("--color-primary-dark"),
          light:   c("--color-primary-light"),
        },
        gold: {
          DEFAULT: c("--color-accent-gold"),
          light:   c("--color-accent-gold-light"),
          dark:    c("--color-accent-gold-dark"),
          muted:   c("--color-accent-gold-muted"),
        },
        primary: {
          DEFAULT: c("--color-primary"),
          dark:    c("--color-primary-dark"),
        },
        surface: {
          DEFAULT: c("--color-surface"),
          card:    c("--color-surface-card"),
          dark:    c("--color-surface-dark"),
        },
        portal: {
          "super-admin": c("--portal-super-admin"),
          "tenant-admin": c("--portal-tenant-admin"),
          teller:         c("--portal-teller"),
          member:         c("--portal-member"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
      },
      boxShadow: {
        card:     "var(--shadow-md)",
        elevated: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
