import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#8C7A6B", dark: "#6F5F52", light: "#EFE9E4" },
      },
    },
  },
  plugins: [],
};
export default config;
