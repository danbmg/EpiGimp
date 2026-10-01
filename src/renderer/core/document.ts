import { createLayer, type Layer } from './layer';

// Le document édité ; ce nom masque volontairement le Document du DOM dans les fichiers qui l'importent.
export interface Document {
  width: number;
  height: number;
  /** Du bas vers le haut : layers[0] est dessiné en premier. */
  layers: Layer[];
  /** Le calque sur lequel les outils peignent ; toujours l'un des calques de `layers`. */
  activeLayer: Layer;
}

// Un nouveau document démarre avec un seul calque de fond vide et transparent, qui est le calque actif.
export function createDocument(width: number, height: number): Document {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`Invalid document size: ${width}x${height}`);
  }
  const background = createLayer('Background', width, height);
  return {
    width,
    height,
    layers: [background],
    activeLayer: background,
  };
}
