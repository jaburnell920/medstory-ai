// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        medblue: '#35b4fc',
        medorange: '#ff914d',
      },
      fontFamily: {
        serif: ['Lora', 'serif'], // ✅ Add Lora as your serif font
      },
    },
  },
  content: ['./src/**/*.{js,ts,jsx,tsx}'], // ✅ Ensure Tailwind scans your src files
};
