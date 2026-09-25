export interface Point {
  x: number;
  y: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 32;
/** Marge gardée autour du document quand il est réduit pour tenir dans la vue (pixels CSS). */
const FIT_MARGIN = 20;

// Convertit entre pixels écran (relatifs au canvas) et pixels document (ce que stockent les calques).
export class Viewport {
  scale = 1;
  offsetX = 0;
  offsetY = 0;

  screenToDoc(point: Point): Point {
    return {
      x: (point.x - this.offsetX) / this.scale,
      y: (point.y - this.offsetY) / this.scale,
    };
  }

  docToScreen(point: Point): Point {
    return {
      x: point.x * this.scale + this.offsetX,
      y: point.y * this.scale + this.offsetY,
    };
  }

  // Zoome sans bouger le point pointé par la souris, au lieu de zoomer vers le coin en haut à gauche.
  zoomAt(screenPoint: Point, factor: number): void {
    const anchor = this.screenToDoc(screenPoint);
    this.scale = clamp(this.scale * factor, MIN_SCALE, MAX_SCALE);
    this.offsetX = screenPoint.x - anchor.x * this.scale;
    this.offsetY = screenPoint.y - anchor.y * this.scale;
  }

  panBy(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  // Centre le document dans la vue, à 100 % sauf s'il est trop grand pour tenir.
  centerDocument(docWidth: number, docHeight: number, viewWidth: number, viewHeight: number): void {
    const fitScale = Math.min(
      (viewWidth - 2 * FIT_MARGIN) / docWidth,
      (viewHeight - 2 * FIT_MARGIN) / docHeight,
    );
    this.scale = clamp(Math.min(1, fitScale), MIN_SCALE, MAX_SCALE);
    this.offsetX = (viewWidth - docWidth * this.scale) / 2;
    this.offsetY = (viewHeight - docHeight * this.scale) / 2;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
