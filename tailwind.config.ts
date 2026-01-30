import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "msc-red": {
          DEFAULT: "hsl(var(--msc-red))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "hsl(var(--foreground))",
            "h1, h2, h3, h4, h5, h6": {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            h1: {
              fontSize: "2.25em",
              marginTop: "0",
              marginBottom: "0.8em",
            },
            h2: {
              fontSize: "1.5em",
              marginTop: "1.5em",
              marginBottom: "0.75em",
              borderBottomWidth: "1px",
              borderBottomColor: "hsl(var(--border))",
              paddingBottom: "0.3em",
            },
            h3: {
              fontSize: "1.25em",
              marginTop: "1.25em",
              marginBottom: "0.5em",
            },
            p: {
              marginTop: "0.75em",
              marginBottom: "0.75em",
            },
            a: {
              color: "hsl(var(--primary))",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              "&:hover": {
                color: "hsl(var(--primary) / 0.8)",
              },
            },
            "ul, ol": {
              paddingLeft: "1.5em",
            },
            li: {
              marginTop: "0.25em",
              marginBottom: "0.25em",
            },
            code: {
              color: "hsl(var(--primary))",
              backgroundColor: "hsl(var(--accent))",
              padding: "0.125em 0.25em",
              borderRadius: "0.25em",
              fontSize: "0.875em",
              fontWeight: "500",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "hsl(var(--accent))",
              borderRadius: "0.5em",
              padding: "1em",
              overflowX: "auto",
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              fontSize: "0.875em",
            },
            blockquote: {
              borderLeftWidth: "4px",
              borderLeftColor: "hsl(var(--primary))",
              paddingLeft: "1em",
              fontStyle: "italic",
              color: "hsl(var(--muted-foreground))",
            },
            hr: {
              borderColor: "hsl(var(--border))",
              marginTop: "2em",
              marginBottom: "2em",
            },
            strong: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            table: {
              width: "100%",
              borderCollapse: "collapse",
            },
            "th, td": {
              padding: "0.5em 1em",
              borderWidth: "1px",
              borderColor: "hsl(var(--border))",
            },
            th: {
              backgroundColor: "hsl(var(--accent))",
              fontWeight: "600",
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-links": "hsl(var(--primary))",
            "--tw-prose-bold": "hsl(var(--foreground))",
            "--tw-prose-counters": "hsl(var(--muted-foreground))",
            "--tw-prose-bullets": "hsl(var(--muted-foreground))",
            "--tw-prose-hr": "hsl(var(--border))",
            "--tw-prose-quotes": "hsl(var(--muted-foreground))",
            "--tw-prose-quote-borders": "hsl(var(--primary))",
            "--tw-prose-captions": "hsl(var(--muted-foreground))",
            "--tw-prose-code": "hsl(var(--primary))",
            "--tw-prose-pre-code": "hsl(var(--foreground))",
            "--tw-prose-pre-bg": "hsl(var(--accent))",
            "--tw-prose-th-borders": "hsl(var(--border))",
            "--tw-prose-td-borders": "hsl(var(--border))",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
