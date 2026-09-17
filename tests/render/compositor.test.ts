import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument, type Document } from '../../src/renderer/core/document';
import { createLayer } from '../../src/renderer/core/layer';
import { Compositor } from '../../src/renderer/render/compositor';
import { Viewport } from '../../src/renderer/render/viewport';
import { stubOffscreenCanvas } from '../helpers/fakeOffscreenCanvas';

type Call = [name: string, ...args: unknown[]];

// Fake 2D context that records the drawing calls, with the state that matters at the time of each call.
function makeRecordingContext(width: number, height: number) {
  const calls: Call[] = [];
  const pattern = { kind: 'checker-pattern' };
  const ctx = {
    canvas: { width, height },
    globalAlpha: 1,
    fillStyle: '' as unknown,
    imageSmoothingEnabled: true,
    setTransform: (...args: number[]) => calls.push(['setTransform', ...args]),
    clearRect: (...args: number[]) => calls.push(['clearRect', ...args]),
    fillRect(...args: number[]) {
      calls.push(['fillRect', this.fillStyle, ...args]);
    },
    drawImage(image: unknown, ...args: number[]) {
      calls.push(['drawImage', image, this.globalAlpha, ...args]);
    },
    createPattern: () => pattern,
  };
  return { ctx, calls, pattern, compositor: new Compositor(ctx as unknown as CanvasRenderingContext2D) };
}

function makeDocumentWithLayers(): Document {
  const doc = createDocument(100, 50);
  const middle = createLayer('Middle', 100, 50);
  middle.opacity = 0.5;
  const top = createLayer('Top', 100, 50);
  top.opacity = 0.25;
  doc.layers.push(middle, top);
  return doc;
}

const drawImageCalls = (calls: Call[]) => calls.filter(([name]) => name === 'drawImage');

beforeEach(stubOffscreenCanvas);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Compositor.render', () => {
  it('clears the whole canvas first', () => {
    const { calls, compositor } = makeRecordingContext(640, 480);

    compositor.render(createDocument(100, 50), new Viewport(), 1);

    expect(calls[0]).toEqual(['setTransform', 1, 0, 0, 1, 0, 0]);
    expect(calls[1]).toEqual(['clearRect', 0, 0, 640, 480]);
  });

  it('draws visible layers bottom to top, each with its own opacity', () => {
    const { calls, compositor } = makeRecordingContext(640, 480);
    const doc = makeDocumentWithLayers();

    compositor.render(doc, new Viewport(), 1);

    expect(drawImageCalls(calls)).toEqual([
      ['drawImage', doc.layers[0].canvas, 1, 0, 0],
      ['drawImage', doc.layers[1].canvas, 0.5, 0, 0],
      ['drawImage', doc.layers[2].canvas, 0.25, 0, 0],
    ]);
  });

  it('does not draw hidden layers', () => {
    const { calls, compositor } = makeRecordingContext(640, 480);
    const doc = makeDocumentWithLayers();
    doc.layers[1].visible = false;

    compositor.render(doc, new Viewport(), 1);

    const drawn = drawImageCalls(calls).map(([, image]) => image);
    expect(drawn).toEqual([doc.layers[0].canvas, doc.layers[2].canvas]);
  });

  it('fills the document area with the checkerboard before drawing any layer', () => {
    const { calls, pattern, compositor } = makeRecordingContext(640, 480);
    const viewport = new Viewport();
    viewport.scale = 2;
    viewport.offsetX = 30;
    viewport.offsetY = 40;

    compositor.render(makeDocumentWithLayers(), viewport, 1);

    const checkerIndex = calls.findIndex(([name, style]) => name === 'fillRect' && style === pattern);
    const firstLayerIndex = calls.findIndex(([name]) => name === 'drawImage');
    expect(checkerIndex).toBeGreaterThan(-1);
    expect(checkerIndex).toBeLessThan(firstLayerIndex);
    // Anchored on the document's corner, covering the zoomed document (100x50 at scale 2).
    expect(calls[checkerIndex - 1]).toEqual(['setTransform', 1, 0, 0, 1, 30, 40]);
    expect(calls[checkerIndex]).toEqual(['fillRect', pattern, 0, 0, 200, 100]);
  });

  it('draws layers through the viewport transform, converted to device pixels', () => {
    const { calls, compositor } = makeRecordingContext(640, 480);
    const viewport = new Viewport();
    viewport.scale = 1.5;
    viewport.offsetX = 10;
    viewport.offsetY = 20;

    compositor.render(createDocument(100, 50), viewport, 2);

    const firstLayerIndex = calls.findIndex(([name]) => name === 'drawImage');
    expect(calls[firstLayerIndex - 1]).toEqual(['setTransform', 3, 0, 0, 3, 20, 40]);
  });

  it('restores full opacity after drawing', () => {
    const { ctx, compositor } = makeRecordingContext(640, 480);

    compositor.render(makeDocumentWithLayers(), new Viewport(), 1);

    expect(ctx.globalAlpha).toBe(1);
  });
});
