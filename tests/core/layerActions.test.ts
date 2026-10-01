import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument, type Document } from '../../src/renderer/core/document';
import { History } from '../../src/renderer/core/history';
import { createLayer, type Layer } from '../../src/renderer/core/layer';
import { addLayer, deleteLayer, moveLayer, nextLayerName } from '../../src/renderer/core/layerActions';
import { stubOffscreenCanvas } from '../helpers/fakeOffscreenCanvas';

beforeEach(stubOffscreenCanvas);
afterEach(() => {
  vi.unstubAllGlobals();
});

const names = (doc: Document) => doc.layers.map((layer) => layer.name);

// Document with layers A (bottom), B, C (top), and B active.
function makeDocument() {
  const doc = createDocument(10, 10);
  doc.layers = ['A', 'B', 'C'].map((name) => createLayer(name, 10, 10));
  const [a, b, c] = doc.layers;
  doc.activeLayer = b;
  return { doc, a, b, c, history: new History() };
}

describe('addLayer', () => {
  it('adds an empty layer of the document size just above the active one, and makes it active', () => {
    const { doc, history } = makeDocument();

    const layer = addLayer(doc, history);

    expect(names(doc)).toEqual(['A', 'B', 'Layer 1', 'C']);
    expect(doc.activeLayer).toBe(layer);
    expect([layer.canvas.width, layer.canvas.height]).toEqual([10, 10]);
    expect([layer.visible, layer.opacity]).toEqual([true, 1]);
  });

  it('is undone in one step, which gives back the previous active layer', () => {
    const { doc, b, history } = makeDocument();

    const layer = addLayer(doc, history);
    history.undo();

    expect(names(doc)).toEqual(['A', 'B', 'C']);
    expect(doc.activeLayer).toBe(b);
    history.redo();
    expect(doc.layers[2]).toBe(layer);
    expect(doc.activeLayer).toBe(layer);
  });
});

describe('deleteLayer', () => {
  it('deletes the active layer and selects the one below', () => {
    const { doc, a, history } = makeDocument();

    expect(deleteLayer(doc, history)).toBe(true);

    expect(names(doc)).toEqual(['A', 'C']);
    expect(doc.activeLayer).toBe(a);
  });

  it('selects the new bottom layer when the bottom one is deleted', () => {
    const { doc, a, b, history } = makeDocument();
    doc.activeLayer = a;

    deleteLayer(doc, history);

    expect(names(doc)).toEqual(['B', 'C']);
    expect(doc.activeLayer).toBe(b);
  });

  it('keeps the last layer', () => {
    const doc = createDocument(10, 10);
    const history = new History();

    expect(deleteLayer(doc, history)).toBe(false);

    expect(doc.layers).toHaveLength(1);
    expect(history.canUndo).toBe(false);
  });

  it('is undone with the same layer object, so its pixels come back too', () => {
    const { doc, b, history } = makeDocument();

    deleteLayer(doc, history);
    history.undo();

    expect(doc.layers[1]).toBe(b);
    expect(doc.activeLayer).toBe(b);
  });
});

describe('moveLayer', () => {
  it.each([
    ['A', 'above', 'C', ['B', 'C', 'A']],
    ['A', 'below', 'C', ['B', 'A', 'C']],
    ['C', 'below', 'A', ['C', 'A', 'B']],
    ['C', 'above', 'A', ['A', 'C', 'B']],
  ] as const)('puts %s %s %s', (moved, position, target, expected) => {
    const { doc, history } = makeDocument();
    const find = (name: string) => doc.layers.find((layer) => layer.name === name) as Layer;

    expect(moveLayer(doc, history, find(moved), find(target), position)).toBe(true);

    expect(names(doc)).toEqual(expected);
  });

  it('keeps the active layer', () => {
    const { doc, a, b, c, history } = makeDocument();

    moveLayer(doc, history, a, c, 'above');

    expect(doc.activeLayer).toBe(b);
  });

  it('is undone in one step', () => {
    const { doc, a, c, history } = makeDocument();

    moveLayer(doc, history, a, c, 'above');
    history.undo();

    expect(names(doc)).toEqual(['A', 'B', 'C']);
  });

  it.each([
    ['onto itself', 'B', 'B', 'above'],
    ['where it already is (B is already above A)', 'B', 'A', 'above'],
    ['where it already is (B is already below C)', 'B', 'C', 'below'],
  ] as const)('does nothing and records nothing when dropped %s', (_, moved, target, position) => {
    const { doc, history } = makeDocument();
    const find = (name: string) => doc.layers.find((layer) => layer.name === name) as Layer;

    expect(moveLayer(doc, history, find(moved), find(target), position)).toBe(false);

    expect(names(doc)).toEqual(['A', 'B', 'C']);
    expect(history.canUndo).toBe(false);
  });
});

describe('nextLayerName', () => {
  const layers = (...layerNames: string[]) => layerNames.map((name) => createLayer(name, 1, 1));

  it('starts at Layer 1', () => {
    expect(nextLayerName(layers('Background'))).toBe('Layer 1');
  });

  it('goes after the highest number, even with gaps', () => {
    expect(nextLayerName(layers('Background', 'Layer 3', 'Layer 1'))).toBe('Layer 4');
  });

  it('ignores names that only look alike', () => {
    expect(nextLayerName(layers('Layer 2 copy', 'My Layer 9'))).toBe('Layer 1');
  });
});
