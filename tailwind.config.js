/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx,html}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      colors: {
        'editor-bg': '#1e1e1e',
        'editor-line': '#2d2d30',
        'terminal-bg': '#0f172a',
      }
    },
  },
  plugins: [],
}
