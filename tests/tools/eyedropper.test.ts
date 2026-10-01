import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Document } from '../../src/renderer/core/document';
import type { Layer } from '../../src/renderer/core/layer';
import { Eyedropper, toHexColor } from '../../src/renderer/tools/eyedropper';

type Call = [name: string, ...args: unknown[]];

// Fake context of the eyedropper's 1x1 canvas: records the drawing calls and returns `pixel` when read.
function stubSampleCanvas(pixel: number[]) {
  const calls: Call[] = [];
  const ctx = {
    globalAlpha: 1,
    setTransform: (...args: number[]) => calls.push(['setTransform', ...args]),
    clearRect: (...args: number[]) => calls.push(['clearRect', ...args]),
    drawImage(image: unknown, ...args: number[]) {
      calls.push(['drawImage', image, this.globalAlpha, ...args]);
    },
    getImageData: (...args: number[]) => {
      calls.push(['getImageData', ...args]);
      return { data: pixel };
    },
  };
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(
        readonly width: number,
        readonly height: number,
      ) {}
      getContext = () => ctx;
    },
  );
  return calls;
}

function makeLayer(name: string, opacity = 1, visible = true): Layer {
  return { name, canvas: { name } as unknown as OffscreenCanvas, opacity, visible };
}

function makeDocument(): Document {
  return {
    width: 100,
    height: 50,
    layers: [makeLayer('Background'), makeLayer('Hidden', 1, false), makeLayer('Top', 0.5)],
  };
}

function makeEyedropper(pixel: number[]) {
  const calls = stubSampleCanvas(pixel);
  const doc = makeDocument();
  const picked: string[] = [];
  const tool = new Eyedropper(doc, (color) => picked.push(color));
  return { calls, doc, picked, tool };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Eyedropper', () => {
  it('reads the clicked pixel of the composed image: visible layers, bottom to top, with their opacity', () => {
    const { calls, doc, picked, tool } = makeEyedropper([255, 128, 0, 255]);

    tool.onStrokeStart([{ x: 12.7, y: 34.2 }]);

    expect(calls).toEqual([
      ['setTransform', 1, 0, 0, 1, 0, 0],
      ['clearRect', 0, 0, 1, 1],
      // Shifted so that document pixel (12, 34) lands on the only pixel of the sample canvas.
      ['setTransform', 1, 0, 0, 1, -12, -34],
      ['drawImage', doc.layers[0].canvas, 1, 0, 0],
      ['drawImage', doc.layers[2].canvas, 0.5, 0, 0],
      ['getImageData', 0, 0, 1, 1],
    ]);
    expect(picked).toEqual(['#ff8000']);
  });

  it('follows the pointer while dragging', () => {
    const { calls, picked, tool } = makeEyedropper([0, 0, 255, 255]);

    tool.onStrokeMove([
      { x: 1, y: 1 },
      { x: 40, y: 20 },
    ]);

    expect(calls).toContainEqual(['setTransform', 1, 0, 0, 1, -40, -20]);
    expect(picked).toEqual(['#0000ff']);
  });

  it('keeps the color of a half-transparent pixel, without its transparency', () => {
    const { picked, tool } = makeEyedropper([10, 20, 30, 128]);

    tool.onStrokeStart([{ x: 5, y: 5 }]);

    expect(picked).toEqual(['#0a141e']);
  });

  it('keeps the current color on a fully transparent pixel', () => {
    const { picked, tool } = makeEyedropper([0, 0, 0, 0]);

    tool.onStrokeStart([{ x: 5, y: 5 }]);

    expect(picked).toEqual([]);
  });

  it.each([
    [-0.5, 10],
    [10, -1],
    [100, 10],
    [10, 50],
  ])('ignores a click outside the document at (%s, %s)', (x, y) => {
    const { calls, picked, tool } = makeEyedropper([255, 255, 255, 255]);

    tool.onStrokeStart([{ x, y }]);

    expect(calls).toEqual([]);
    expect(picked).toEqual([]);
  });

  it('picks pixels on the last row and column', () => {
    const { picked, tool } = makeEyedropper([1, 2, 3, 255]);

    tool.onStrokeStart([{ x: 99.9, y: 49.9 }]);

    expect(picked).toEqual(['#010203']);
  });
});

describe('toHexColor', () => {
  it('writes each channel as 2 lowercase hex digits, like <input type="color">', () => {
    expect(toHexColor(255, 128, 0)).toBe('#ff8000');
    expect(toHexColor(0, 0, 0)).toBe('#000000');
    expect(toHexColor(1, 2, 3)).toBe('#010203');
  });
});
