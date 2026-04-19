export const colors = {
  bg: {
    base: '#181A20',
    surface: '#1E2329',
    raised: '#2B3139',
    deep: '#0B0E11',
  },
  text: {
    primary: '#EAECEF',
    muted: '#848E9C',
    subtle: '#474D57',
  },
  border: {
    default: '#2B3139',
    strong: '#474D57',
  },
  accent: {
    yellow: '#F0B90B',
    yellowDim: '#B8921A',
    success: '#0ECB81',
    danger: '#F6465D',
    info: '#1E90FF',
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

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const;
