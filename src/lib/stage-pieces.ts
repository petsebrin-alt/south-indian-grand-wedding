import type { ImageMetadata } from 'astro';
import stage from '../assets/stage/stage.json';

/**
 * The cream temple background of the desktop screen (src/assets/stage/, npm run stage:assets), as a phone page's backdrop:
 * its garlands, lamps and bells, placed on the page's top part. The page shows the left side's first half-width of
 * columns and, mirrored, the right side's last half-width (the same split the desktop screen has).
 */
const pieceImages = import.meta.glob<{ default: ImageMetadata }>('../assets/stage/piece-*.webp', { eager: true });
export const pieceSrc = (file: string) => pieceImages[`../assets/stage/${file}.webp`].default.src;

export const STAGE_PAGE = { width: stage.page.width, top: stage.page.top, bottom: stage.page.bottom };

export function stagePagePieces() {
  const PANEL_W = stage.panel.width;
  const PANEL_H = stage.panel.height;
  const half = STAGE_PAGE.width / 2;
  return (stage.pieces as { id: string; side: string; file: string; box: number[]; amp: number; period: number; lag: number; phase: number }[])
    .filter((p) => (stage.page.pieces as string[]).includes(p.id))
    .map((p) => {
      const px = (p.box[0] / 100) * PANEL_W;
      // the right side's last `half` columns (panel columns PANEL_W - half and on) fill the page's right half
      const x = p.side === 'l' ? px : px - (PANEL_W - half) + half;
      return {
        ...p,
        src: pieceSrc(p.file),
        left: (x / STAGE_PAGE.width) * 100,
        width: (((p.box[2] / 100) * PANEL_W) / STAGE_PAGE.width) * 100,
        top: (((p.box[1] / 100) * PANEL_H) / STAGE_PAGE.top) * 100,
        height: (((p.box[3] / 100) * PANEL_H) / STAGE_PAGE.top) * 100,
      };
    })
    .filter((p) => p.left > -20 && p.left < 100);
}
