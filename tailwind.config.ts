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
        background: "var(--background)",
        foreground: "var(--foreground)",
        evergreen: "#023B28",
        jungle: "#149077",
        mist: "#E2F3F0",
        yale: "#0A5071",
        lavender: "#EBD6E9",
        "pink-soft": "#F5E8F3",
        cream: "#FDFAF7",
        amber: "#FFF3E8",
        "dark-green": "#2a3d30",
      },
    },
  },
  plugins: [],
};
export default config;
