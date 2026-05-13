/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        glass: {
          light: 'rgba(255,255,255,0.55)',
          dark: 'rgba(20,20,22,0.55)'
        }
      },
      animation: {
        'glass-in': 'glassIn 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'drop-pulse': 'dropPulse 1.8s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite'
      },
      keyframes: {
        glassIn: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.96)', filter: 'blur(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        },
        dropPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.65' },
          '50%': { transform: 'scale(1.04)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
}
