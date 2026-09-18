import type { Layer } from '../core/layer';
import type { Point } from '../render/viewport';
import type { StrokeListener } from './strokeRecorder';

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 500;

/** Color used by the eraser: `destination-out` only reads its alpha, so any fully opaque color works. */
const ERASE_COLOR = '#000000';

// Shared by the brush and the eraser. The toolbar changes `size`, the color picker (#8) will change `color`.
export interface PaintSettings {
  /** CSS color of the brush. */
  color: string;
  /** Brush diameter in document pixels, so it covers the same part of the image at any zoom. */
  size: number;
}

// - paint: 'source-over', the default: new pixels are drawn over the old ones.
// - erase: 'destination-out': the old pixels are kept only where nothing is drawn, so painted areas
//   become transparent.
export type PaintMode = 'paint' | 'erase';

// Brush and eraser: the same code, only the compositing mode differs.
// Paints on the active layer as the stroke goes, not on the screen: the compositor shows the result.
export class PaintTool implements StrokeListener {
  private readonly mode: PaintMode;
  private readonly getLayer: () => Layer;
  private readonly settings: PaintSettings;

  // `getLayer` is called at each event, so the tool always paints on the layer that is active right now.
  constructor(mode: PaintMode, getLayer: () => Layer, settings: PaintSettings) {
    this.mode = mode;
    this.getLayer = getLayer;
    this.settings = settings;
  }

  onStrokeStart(stroke: readonly Point[]): void {
    // A click without moving must leave a dot: a zero-length line may draw nothing, so draw a disc.
    const point = stroke[0];
    this.draw((ctx) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.settings.size / 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  onStrokeMove(stroke: readonly Point[]): void {
    // Only the newest segment: the rest of the stroke is already on the layer.
    // Points are joined by lines, not stamped as dots, so a fast mouse leaves no gaps between two events.
    const from = stroke[stroke.length - 2];
    const to = stroke[stroke.length - 1];
    this.draw((ctx) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  }

  // Runs `paint` on the active layer with the current settings, then restores the layer's context
  // so the next drawing code (another tool, a filter) starts from a clean state.
  private draw(paint: (ctx: OffscreenCanvasRenderingContext2D) => void): void {
    const ctx = this.getLayer().canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context is not available for the layer canvas');
    }
    const color = this.mode === 'erase' ? ERASE_COLOR : this.settings.color;
    ctx.save();
    ctx.globalCompositeOperation = this.mode === 'erase' ? 'destination-out' : 'source-over';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = this.settings.size;
    // Round ends make each segment overlap the next one smoothly, like a round brush tip.
    ctx.lineCap = 'round';
    paint(ctx);
    ctx.restore();
  }
}

// Turns what the user typed into a valid brush size: a whole number of pixels within the limits,
// or null when it is not a number (e.g. an empty field while typing).
export function toBrushSize(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(value)));
}
