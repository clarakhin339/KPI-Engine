export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        line: 'var(--line)',
        linestrong: 'var(--line-strong)',
        fg: 'var(--fg)',
        fgmuted: 'var(--fg-muted)',
        fgsubtle: 'var(--fg-subtle)',
        accent: 'var(--accent)',
        accentsoft: 'var(--accent-soft)',
        accentfg: 'var(--accent-fg)',
        positive: 'var(--positive)',
        positivesoft: 'var(--positive-soft)',
        warning: 'var(--warning)',
        warningsoft: 'var(--warning-soft)',
        danger: 'var(--danger)',
        dangersoft: 'var(--danger-soft)',
        info: 'var(--info)',
        infosoft: 'var(--info-soft)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
