// tailwind.config.ts
import { type Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/components/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#39FF14",
        zinc: {
          900: "#131313",
          950: "#0a0a0a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
