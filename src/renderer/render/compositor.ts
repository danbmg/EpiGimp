import type { Document } from '../core/document';
import type { Viewport } from './viewport';

/** Taille d'une case du damier à l'écran (pixels CSS), quel que soit le zoom. */
const CHECKER_SIZE = 8;
const CHECKER_LIGHT = '#ffffff';
const CHECKER_DARK = '#cccccc';

// Seul code qui dessine sur le canvas visible : le damier, puis les calques visibles par-dessus.
export class Compositor {
  private readonly ctx: CanvasRenderingContext2D;
  private checker: { cellSize: number; pattern: CanvasPattern } | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // Redessine tout : damier puis calques, du bas vers le haut, avec leur opacité.
  render(doc: Document, viewport: Viewport, pixelRatio: number): void {
    const ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const x = viewport.offsetX * pixelRatio;
    const y = viewport.offsetY * pixelRatio;
    const scale = viewport.scale * pixelRatio;

    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = this.checkerPattern(Math.max(1, Math.round(CHECKER_SIZE * pixelRatio)));
    ctx.fillRect(0, 0, doc.width * scale, doc.height * scale);

    ctx.setTransform(scale, 0, 0, scale, x, y);
    // Zoomé : pixels nets comme dans GIMP. Dézoomé : lissage pour éviter un rendu crénelé.
    ctx.imageSmoothingEnabled = viewport.scale < 1;
    for (const layer of doc.layers) {
      if (!layer.visible) {
        continue;
      }
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  // Construit le motif du damier, reconstruit seulement si la taille des cases change.
  private checkerPattern(cellSize: number): CanvasPattern {
    if (this.checker?.cellSize === cellSize) {
      return this.checker.pattern;
    }
    const tile = new OffscreenCanvas(cellSize * 2, cellSize * 2);
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) {
      throw new Error('2D context is not available for the checkerboard tile');
    }
    tileCtx.fillStyle = CHECKER_LIGHT;
    tileCtx.fillRect(0, 0, cellSize * 2, cellSize * 2);
    tileCtx.fillStyle = CHECKER_DARK;
    tileCtx.fillRect(cellSize, 0, cellSize, cellSize);
    tileCtx.fillRect(0, cellSize, cellSize, cellSize);

    const pattern = this.ctx.createPattern(tile, 'repeat');
    if (!pattern) {
      throw new Error('Could not create the checkerboard pattern');
    }
    this.checker = { cellSize, pattern };
    return pattern;
  }
}
