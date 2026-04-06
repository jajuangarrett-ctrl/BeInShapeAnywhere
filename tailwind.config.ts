import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0d0d0d',
          card: '#1a1a1a',
          border: '#2a2a2a',
          green: '#4ADE80',
          greenDark: '#22c55e',
          greenGlow: 'rgba(74, 222, 128, 0.15)',
          text: '#f5f5f5',
          muted: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
}

export default config
