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
