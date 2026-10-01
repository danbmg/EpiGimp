// Un calque possède son propre canvas hors écran ; les outils dessinent dessus, le compositeur l'affiche.
export interface Layer {
  name: string;
  canvas: OffscreenCanvas;
  /** De 0 (invisible) à 1 (opaque), utilisé comme opacité lors de la composition. */
  opacity: number;
  visible: boolean;
}

// Un canvas neuf est transparent : un nouveau calque démarre donc vide.
export function createLayer(name: string, width: number, height: number): Layer {
  return {
    name,
    canvas: new OffscreenCanvas(width, height),
    opacity: 1,
    visible: true,
  };
}

// Contexte 2D du calque : pour y peindre (outils, filtres) ou lire et remettre ses pixels (historique).
export function getLayerContext(layer: Layer): OffscreenCanvasRenderingContext2D {
  const ctx = layer.canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context is not available for the layer canvas');
  }
  return ctx;
}
