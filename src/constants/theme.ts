export const colors = {
  bg: {
    base: '#0f172a',
    surface: '#17212b',
    raised: '#1e293b',
    deep: '#0e1621',
  },
  text: {
    primary: '#f8fafc',
    muted: '#94a3b8',
    subtle: '#64748b',
  },
  border: {
    default: '#334155',
    strong: '#1e293b',
  },
  accent: {
    sky: '#38bdf8',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#ef4444',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;
