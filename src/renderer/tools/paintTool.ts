import type { Layer } from '../core/layer';
import type { Point } from '../render/viewport';
import type { StrokeListener } from './strokeRecorder';

export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 500;

/** Couleur de la gomme : `destination-out` ne lit que son alpha, donc une couleur opaque suffit. */
const ERASE_COLOR = '#000000';

// Réglages partagés entre le pinceau et la gomme.
export interface PaintSettings {
  color: string;
  size: number;
}

// paint = dessine par-dessus ; erase = efface ce qui est dessiné (`destination-out`).
export type PaintMode = 'paint' | 'erase';

// Pinceau et gomme : même code, seul le mode de mélange change.
export class PaintTool implements StrokeListener {
  private readonly mode: PaintMode;
  private readonly getLayer: () => Layer;
  private readonly settings: PaintSettings;

  constructor(mode: PaintMode, getLayer: () => Layer, settings: PaintSettings) {
    this.mode = mode;
    this.getLayer = getLayer;
    this.settings = settings;
  }

  // Un clic sans bouger laisse quand même un point : un trait de longueur nulle peut ne rien dessiner.
  onStrokeStart(stroke: readonly Point[]): void {
    const point = stroke[0];
    this.draw((ctx) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.settings.size / 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Trace uniquement le dernier segment, entre les 2 derniers points reçus.
  onStrokeMove(stroke: readonly Point[]): void {
    const from = stroke[stroke.length - 2];
    const to = stroke[stroke.length - 1];
    this.draw((ctx) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  }

  // Applique `paint` sur le calque actif avec les réglages courants, puis restaure le contexte.
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
    ctx.lineCap = 'round';
    paint(ctx);
    ctx.restore();
  }
}

// Valide la taille tapée par l'utilisateur, ou renvoie null si ce n'est pas un nombre.
export function toBrushSize(value: number): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(value)));
}
