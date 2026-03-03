/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F4FF',
          100: '#DDE6FF',
          200: '#B8CCFF',
          300: '#85A8FF',
          400: '#5580FF',
          500: '#3366FF',
          600: '#1A4FFF',
          700: '#0D3DE6',
          800: '#1033B8',
          900: '#142E8C',
          950: '#0E1D54',
        },
        accent: {
          50: '#F5F0FF',
          100: '#EDE5FF',
          200: '#D9C7FF',
          300: '#BF9EFF',
          400: '#A56EFF',
          500: '#8B42FF',
          600: '#7B2BF5',
          700: '#6A1FDE',
          800: '#581CB8',
          900: '#481A96',
          950: '#2C0D66',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.06)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.08)',
        'primary': '0 4px 14px rgba(51,102,255,0.25)',
        'primary-lg': '0 8px 24px rgba(51,102,255,0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

