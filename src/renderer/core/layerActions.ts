import type { Document } from './document';
import { snapshotLayerList, type History } from './history';
import { createLayer, type Layer } from './layer';

// Actions du panneau des calques (#9). Chacune sauvegarde la liste dans l'historique avant de la changer (#7).

// Ajoute un calque vide juste au-dessus du calque actif, et le rend actif.
export function addLayer(doc: Document, history: History): Layer {
  history.record(snapshotLayerList(doc));
  const layer = createLayer(nextLayerName(doc.layers), doc.width, doc.height);
  doc.layers.splice(doc.layers.indexOf(doc.activeLayer) + 1, 0, layer);
  doc.activeLayer = layer;
  return layer;
}

// Supprime le calque actif ; celui du dessous devient actif (le nouveau calque du bas si c'était le premier).
// Refusé s'il ne reste qu'un calque : un document a toujours au moins un calque où peindre.
export function deleteLayer(doc: Document, history: History): boolean {
  if (doc.layers.length <= 1) {
    return false;
  }
  history.record(snapshotLayerList(doc));
  const index = doc.layers.indexOf(doc.activeLayer);
  doc.layers.splice(index, 1);
  doc.activeLayer = doc.layers[Math.max(0, index - 1)];
  return true;
}

// Place `layer` juste au-dessus ou juste en dessous de `target` (glisser-déposer du panneau).
// Un déplacement qui ne change rien n'ajoute rien à l'historique.
export function moveLayer(
  doc: Document,
  history: History,
  layer: Layer,
  target: Layer,
  position: 'above' | 'below',
): boolean {
  const layers = doc.layers.filter((other) => other !== layer);
  const targetIndex = layers.indexOf(target);
  if (layer === target || targetIndex === -1) {
    return false;
  }
  layers.splice(position === 'above' ? targetIndex + 1 : targetIndex, 0, layer);
  if (layers.every((other, index) => other === doc.layers[index])) {
    return false;
  }
  history.record(snapshotLayerList(doc));
  doc.layers = layers;
  return true;
}

// « Layer N » avec N = le plus grand numéro déjà utilisé + 1, pour éviter deux calques du même nom.
export function nextLayerName(layers: readonly Layer[]): string {
  const numbers = layers.map((layer) => /^Layer (\d+)$/.exec(layer.name)).map((match) => (match ? Number(match[1]) : 0));
  return `Layer ${Math.max(0, ...numbers) + 1}`;
}
