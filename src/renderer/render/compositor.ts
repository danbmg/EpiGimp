import type { Document } from '../core/document';
import type { Viewport } from './viewport';

/** Size of one checkerboard square on screen (CSS pixels), whatever the zoom. */
const CHECKER_SIZE = 8;
const CHECKER_LIGHT = '#ffffff';
const CHECKER_DARK = '#cccccc';

// The only code that draws on the visible canvas: a checkerboard, then the visible layers on top.
export class Compositor {
  private readonly ctx: CanvasRenderingContext2D;
  private checker: { cellSize: number; pattern: CanvasPattern } | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // `pixelRatio` = device pixels per CSS pixel (window.devicePixelRatio). The canvas buffer is in
  // device pixels while the viewport is in CSS pixels, so every position and size is multiplied by it.
  render(doc: Document, viewport: Viewport, pixelRatio: number): void {
    const ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Top-left corner of the document and zoom, in device pixels.
    const x = viewport.offsetX * pixelRatio;
    const y = viewport.offsetY * pixelRatio;
    const scale = viewport.scale * pixelRatio;

    // 1. Checkerboard under the document, so transparent pixels are visible. It is drawn without the
    //    zoom so its squares keep the same size on screen, and anchored on the document's corner.
    ctx.setTransform(1, 0, 0, 1, x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = this.checkerPattern(Math.max(1, Math.round(CHECKER_SIZE * pixelRatio)));
    ctx.fillRect(0, 0, doc.width * scale, doc.height * scale);

    // 2. Visible layers, bottom to top. This transform maps document pixels to device pixels, so each
    //    layer is simply drawn at (0, 0) in document coordinates.
    ctx.setTransform(scale, 0, 0, scale, x, y);
    // Zoomed in: hard-edged pixels, like GIMP. Zoomed out: smoothing avoids jagged, flickering images.
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

  // The pattern is a 2x2-square tile repeated by the canvas. It is rebuilt only when the square size changes.
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
