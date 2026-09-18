import type { Point, Viewport } from '../render/viewport';

// Reacts to strokes as they are drawn: the brush and eraser (#6). Each method receives the stroke so far,
// in document coordinates; the newest point is the last one.
export interface StrokeListener {
  onStrokeStart?(stroke: readonly Point[]): void;
  onStrokeMove?(stroke: readonly Point[]): void;
  onStrokeEnd?(stroke: readonly Point[]): void;
}

// Records one pointer drag as a list of points in document coordinates (image pixels).
// It takes screen points (CSS pixels relative to the canvas, what pointer events give) and converts each one
// with the viewport when it arrives, so points stay right at any zoom, even if the zoom changes mid-stroke.
export class StrokeRecorder {
  private readonly viewport: Viewport;
  private readonly listener: StrokeListener;
  private points: Point[] | null = null;

  constructor(viewport: Viewport, listener: StrokeListener) {
    this.viewport = viewport;
    this.listener = listener;
  }

  get isRecording(): boolean {
    return this.points !== null;
  }

  begin(screenPoint: Point): void {
    // A second pointer pressed during a stroke: finish the first stroke rather than lose it.
    this.end();
    this.points = [this.viewport.screenToDoc(screenPoint)];
    this.listener.onStrokeStart?.(this.points);
  }

  // Ignored when no stroke is in progress: the pointer also moves with no button pressed.
  add(screenPoint: Point): void {
    if (!this.points) {
      return;
    }
    this.points.push(this.viewport.screenToDoc(screenPoint));
    this.listener.onStrokeMove?.(this.points);
  }

  // Ignored when no stroke is in progress, e.g. pointerup after pointerleave already ended the stroke.
  end(): void {
    if (!this.points) {
      return;
    }
    const stroke = this.points;
    this.points = null;
    this.listener.onStrokeEnd?.(stroke);
  }
}
