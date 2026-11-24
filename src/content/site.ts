/** Brand and contact details shown on About and in the menu. */
export const site = {
  name: 'datworks',
  tagline: 'The King of All Trades',
  location: 'West Java, Indonesia',
  instagram: { label: '@datwrk', url: 'https://www.instagram.com/datwrk/' },
  // wa.me wants the number in international format, digits only.
  whatsapp: { label: 'WhatsApp', url: 'https://wa.me/6281317195809' },
  builtBy: { label: 'khanigaraa', url: 'https://github.com/khanigaraa' },
  history: 'Originally built in 2025 for datworks · rebuilt in 2026',
} as const;
