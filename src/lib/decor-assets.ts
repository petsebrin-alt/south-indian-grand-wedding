import type { ImageMetadata } from 'astro';

/**
 * Which decoration slots have real artwork in src/assets/decor/ (same lookup as Decor.astro).
 * Composite scenes (the temple entrance, the courtyard, the R·D monogram) use this to show one
 * supplied photograph in place of their multi-piece stand-in.
 */
const real = import.meta.glob<ImageMetadata>('../assets/decor/*.{avif,webp,png}', { eager: true, import: 'default' });
const names = new Set(Object.keys(real).map((p) => p.replace(/^.*\//, '').replace(/\.\w+$/, '')));

export const hasRealDecor = (name: string) => names.has(name);
