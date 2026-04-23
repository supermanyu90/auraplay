/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        weather: {
          sunny: {
            50: '#FFF9E6',
            100: '#FFEFB8',
            300: '#FCD34D',
            500: '#FBBF24',
            700: '#D97706',
            900: '#78350F',
          },
          cloudy: {
            50: '#F4F6F8',
            100: '#E1E5EA',
            300: '#CBD5E1',
            500: '#94A3B8',
            700: '#475569',
            900: '#1E293B',
          },
          rainy: {
            50: '#EFF6FF',
            100: '#CFE1F4',
            300: '#93C5FD',
            500: '#3B82F6',
            700: '#1D4ED8',
            900: '#1E3A8A',
          },
          stormy: {
            50: '#F3F4F7',
            100: '#D1D5DB',
            300: '#9CA3AF',
            500: '#4B5563',
            700: '#1F2937',
            900: '#111827',
          },
          snowy: {
            50: '#F8FAFC',
            100: '#E2E8F0',
            300: '#CBD5E1',
            500: '#94A3B8',
            700: '#64748B',
            900: '#334155',
          },
          foggy: {
            50: '#F9FAFB',
            100: '#E5E7EB',
            300: '#D1D5DB',
            500: '#9CA3AF',
            700: '#6B7280',
            900: '#374151',
          },
          windy: {
            50: '#ECFDF5',
            100: '#A7F3D0',
            300: '#6EE7B7',
            500: '#10B981',
            700: '#047857',
            900: '#064E3B',
          },
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
