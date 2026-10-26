/**
 * Preview builds show "To be provided" placeholders; production builds hide them (PRD §4.3).
 * Production: `npm run build:production` (sets SITE_MODE=production and runs the launch check).
 */
export const siteMode: 'preview' | 'production' = process.env.SITE_MODE === 'production' ? 'production' : 'preview';
