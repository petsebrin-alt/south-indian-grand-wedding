/** The small part of opentype.js 2 used by src/lib/handwriting.ts (the package ships no types). */
declare module 'opentype.js' {
  interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    x: number;
    y: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
  interface Path {
    commands: PathCommand[];
    getBoundingBox(): BoundingBox;
  }
  interface Font {
    getAdvanceWidth(text: string, fontSize: number): number;
    getPaths(text: string, x: number, y: number, fontSize: number): Path[];
  }
  const opentype: { parse(buffer: ArrayBuffer): Font };
  namespace opentype {
    export type { Font, Path };
  }
  export default opentype;
}
