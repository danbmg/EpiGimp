import type { Document } from '../core/document';
import { drawLayers } from '../render/compositor';
import type { Point } from '../render/viewport';
import type { StrokeListener } from './strokeRecorder';

// Pipette : donne la couleur du pixel cliqué dans l'image composée, et la suit tant qu'on glisse.
// Elle ne modifie aucun pixel, donc elle n'ajoute rien à l'historique.
export class Eyedropper implements StrokeListener {
  private readonly doc: Document;
  private readonly onPick: (color: string) => void;
  /** Un seul pixel, réutilisé à chaque lecture ; lu souvent, donc gardé côté CPU (`willReadFrequently`). */
  private readonly sample: OffscreenCanvasRenderingContext2D;

  constructor(doc: Document, onPick: (color: string) => void) {
    this.doc = doc;
    this.onPick = onPick;
    const sample = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true });
    if (!sample) {
      throw new Error('2D context is not available for the eyedropper');
    }
    this.sample = sample;
  }

  onStrokeStart(stroke: readonly Point[]): void {
    this.pick(stroke[0]);
  }

  onStrokeMove(stroke: readonly Point[]): void {
    this.pick(stroke[stroke.length - 1]);
  }

  // Recompose les calques visibles décalés de (-x, -y) : seul le pixel (x, y) tombe dans le canvas de 1×1.
  // Hors du document ou sur un pixel transparent, il n'y a pas de couleur à prendre : on ne change rien.
  private pick(point: Point): void {
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    if (x < 0 || y < 0 || x >= this.doc.width || y >= this.doc.height) {
      return;
    }
    const ctx = this.sample;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1, 1);
    ctx.setTransform(1, 0, 0, 1, -x, -y);
    drawLayers(ctx, this.doc);
    const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data;
    if (alpha === 0) {
      return;
    }
    this.onPick(toHexColor(r, g, b));
  }
}

// (255, 128, 0) → '#ff8000', le format de <input type="color">.
export function toHexColor(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('');
}
