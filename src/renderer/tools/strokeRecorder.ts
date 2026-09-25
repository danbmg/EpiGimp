import type { Point, Viewport } from '../render/viewport';

// Réagit à un tracé pendant qu'il se dessine : utilisé par le pinceau et la gomme (#6).
export interface StrokeListener {
  onStrokeStart?(stroke: readonly Point[]): void;
  onStrokeMove?(stroke: readonly Point[]): void;
  onStrokeEnd?(stroke: readonly Point[]): void;
}

// Enregistre un tracé en coordonnées document, converties dès l'arrivée de chaque point.
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

  // Démarre un tracé ; termine d'abord le précédent si un second doigt/bouton était encore actif.
  begin(screenPoint: Point): void {
    this.end();
    this.points = [this.viewport.screenToDoc(screenPoint)];
    this.listener.onStrokeStart?.(this.points);
  }

  // Ajoute un point au tracé en cours ; ignoré si aucun tracé n'a commencé.
  add(screenPoint: Point): void {
    if (!this.points) {
      return;
    }
    this.points.push(this.viewport.screenToDoc(screenPoint));
    this.listener.onStrokeMove?.(this.points);
  }

  // Termine le tracé en cours ; ignoré s'il est déjà terminé.
  end(): void {
    if (!this.points) {
      return;
    }
    const stroke = this.points;
    this.points = null;
    this.listener.onStrokeEnd?.(stroke);
  }
}
