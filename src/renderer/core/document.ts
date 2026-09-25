import { createLayer, type Layer } from './layer';

// Le document édité ; ce nom masque volontairement le Document du DOM dans les fichiers qui l'importent.
export interface Document {
  width: number;
  height: number;
  /** Du bas vers le haut : layers[0] est dessiné en premier. */
  layers: Layer[];
}

// Un nouveau document démarre avec un seul calque de fond vide et transparent.
export function createDocument(width: number, height: number): Document {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`Invalid document size: ${width}x${height}`);
  }
  return {
    width,
    height,
    layers: [createLayer('Background', width, height)],
  };
}
