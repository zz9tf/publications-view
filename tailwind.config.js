/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      margin: {
        10: "2.5rem", // 确保 mx-10 生效
      },
    },
  },
  plugins: [],
};
