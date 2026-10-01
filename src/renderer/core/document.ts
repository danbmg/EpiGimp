import { createLayer, type Layer } from './layer';

/** Côté maximal d'une image, en pixels : l'historique garde une copie complète du calque à chaque action (#7). */
export const MAX_DOCUMENT_SIZE = 4096;

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
  if (!isValidSize(width) || !isValidSize(height)) {
    throw new RangeError(`Invalid image size: ${width}x${height} (1 to ${MAX_DOCUMENT_SIZE} px per side)`);
  }
  const background = createLayer('Background', width, height);
  return {
    width,
    height,
    layers: [background],
    activeLayer: background,
  };
}

// Remplace le contenu de `doc` par celui de `next` (New, Open), sans changer d'objet :
// le canvas, les outils et le panneau gardent leur référence au même document.
export function replaceDocument(doc: Document, next: Document): void {
  doc.width = next.width;
  doc.height = next.height;
  doc.layers = [...next.layers];
  doc.activeLayer = next.activeLayer;
}

function isValidSize(size: number): boolean {
  return Number.isInteger(size) && size >= 1 && size <= MAX_DOCUMENT_SIZE;
}
