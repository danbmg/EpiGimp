export interface Point {
  x: number;
  y: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 32;
/** Free space kept around the document when it is shrunk to fit the view (CSS pixels). */
const FIT_MARGIN = 20;

// Converts between two coordinate systems:
// - screen: CSS pixels, relative to the top-left corner of the visible canvas (what pointer events give);
// - document: image pixels (what layers store).
//
//   screen = doc * scale + offset        doc = (screen - offset) / scale
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

  // Multiplies the zoom by `factor` while keeping the document point under `screenPoint` in place,
  // so the image zooms towards the mouse instead of towards its top-left corner.
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

  // Centers the document in the view, at 100% unless it is too big to fit.
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
