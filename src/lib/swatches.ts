/** Colour values for the dress-code palette names in src/data/wedding.ts (THEME §13 P13). */
const SWATCHES: Record<string, string> = {
  'Leaf green': '#5f8a2e',
  'Rose pink': '#d8738a',
  Marigold: '#ef9a26',
  'Turmeric yellow': '#e7b10a',
  Ivory: '#fff3dc',
  'Soft green': '#a9c08a',
  Emerald: '#1f6f50',
  Ruby: '#9b1b30',
  Sapphire: '#2a4f8f',
  'Temple maroon': '#7a2635',
  'Antique gold': '#c49a45',
  'Champagne gold': '#e2cc97',
  Blush: '#efc3bb',
};

export const swatch = (name: string): string => SWATCHES[name] ?? '#c49a45';

/** Short event names for tabs and chips. */
export const shortEventName: Record<string, string> = {
  mehndi: 'Mehndi',
  haldi: 'Haldi',
  sangeet: 'Sangeet',
  wedding: 'Wedding',
  reception: 'Reception',
};
