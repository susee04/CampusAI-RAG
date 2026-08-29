/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#050816",
        cardBg: "rgba(15, 23, 42, 0.65)",
        primaryBlue: "#3b82f6",
        neonPurple: "#a855f7",
        neonCyan: "#06b6d4"
      },
      boxShadow: {
        glowBlue: "0 0 30px rgba(59, 130, 246, 0.5)",
        glowPurple: "0 0 30px rgba(168, 85, 247, 0.5)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'orbit 15s linear infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' }
        }
      }
    },
  },
  plugins: [],
}
