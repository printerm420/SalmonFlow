/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceHighlight: '#2D2D2D',
        primary: '#10B981', // Emerald-500
        secondary: '#3B82F6', // Blue-500
        warning: '#F59E0B', // Amber-500
        danger: '#EF4444', // Red-500
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
      },
      fontFamily: {
        sans: ['System'], // NativeWind handles this well
      }
    },
  },
  plugins: [],
}

