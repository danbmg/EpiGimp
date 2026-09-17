import { createLayer, type Layer } from './layer';

// The image being edited. In files that import it, this type hides the DOM's own `Document` type.
export interface Document {
  width: number;
  height: number;
  /** Ordered bottom to top: layers[0] is drawn first, the last layer ends up on top. */
  layers: Layer[];
}

// A new document has a single empty (transparent) background layer of the same size.
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
