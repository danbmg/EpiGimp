import { describe, expect, it } from 'vitest';
import { applyFilter } from '../../src/renderer/core/applyFilter';
import { History } from '../../src/renderer/core/history';
import type { Layer } from '../../src/renderer/core/layer';
import { invert } from '../../src/renderer/filters/colorFilters';

// Layer of 2x1 pixels whose fake context keeps its pixels in an array, like a real canvas would.
function makeLayer() {
  let pixels = [10, 20, 30, 255, 0, 0, 0, 0];
  const ctx = {
    getImageData: (x: number, y: number, width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(pixels),
    }),
    putImageData: (image: { data: Uint8ClampedArray }) => {
      pixels = [...image.data];
    },
  };
  const canvas = { width: 2, height: 1, getContext: () => ctx };
  const layer: Layer = { name: 'Background', canvas: canvas as unknown as OffscreenCanvas, opacity: 1, visible: true };
  return { layer, pixels: () => pixels };
}

describe('applyFilter', () => {
  it('replaces the pixels of the layer by the filtered ones', () => {
    const { layer, pixels } = makeLayer();

    applyFilter(layer, new History(), invert);

    expect(pixels()).toEqual([245, 235, 225, 255, 255, 255, 255, 0]);
  });

  it('is undone and redone in one step', () => {
    const { layer, pixels } = makeLayer();
    const history = new History();

    applyFilter(layer, history, invert);
    history.undo();
    expect(pixels()).toEqual([10, 20, 30, 255, 0, 0, 0, 0]);
    expect(history.undo()).toBe(false);
    history.redo();
    expect(pixels()).toEqual([245, 235, 225, 255, 255, 255, 255, 0]);
  });

  it('gives the filter the whole layer', () => {
    const { layer } = makeLayer();
    const seen: number[][] = [];

    applyFilter(layer, new History(), (image) => {
      seen.push([image.width, image.height, image.data.length]);
      return image;
    });

    expect(seen).toEqual([[2, 1, 8]]);
  });
});
