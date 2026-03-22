import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0A1628",
        navy2: "#0F2040",
        gold: "#C9A84C",
        gold2: "#E8C97A",
        muted: "#8A9BB5",
      },
    },
  },
  plugins: [],
};
export default config;