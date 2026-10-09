import type { Filter } from '../filters/pixels';
import { snapshotLayerPixels, type History } from './history';
import { getLayerContext, type Layer } from './layer';

// Applique un filtre à un seul calque, en passant par l'historique : Ctrl+Z remet le calque d'avant (#7).
export function applyFilter(layer: Layer, history: History, filter: Filter): void {
  history.record(snapshotLayerPixels(layer));
  const ctx = getLayerContext(layer);
  const image = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
  // On réécrit dans l'ImageData qu'on vient de lire : pas besoin d'en fabriquer un nouveau.
  image.data.set(filter(image).data);
  ctx.putImageData(image, 0, 0);
}
