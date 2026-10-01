import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument, MAX_DOCUMENT_SIZE, replaceDocument } from '../../src/renderer/core/document';
import { stubOffscreenCanvas } from '../helpers/fakeOffscreenCanvas';

beforeEach(stubOffscreenCanvas);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createDocument', () => {
  it('stores the document size', () => {
    const doc = createDocument(800, 600);

    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
  });

  it('starts with exactly one background layer covering the whole document', () => {
    const doc = createDocument(800, 600);

    expect(doc.layers).toHaveLength(1);
    const [background] = doc.layers;
    expect(background.name).toBe('Background');
    expect(background.visible).toBe(true);
    expect(background.opacity).toBe(1);
    expect(background.canvas.width).toBe(800);
    expect(background.canvas.height).toBe(600);
  });

  it('makes the background the active layer', () => {
    const doc = createDocument(800, 600);

    expect(doc.activeLayer).toBe(doc.layers[0]);
  });

  it.each([
    [0, 600],
    [800, 0],
    [-1, 600],
    [800.5, 600],
    [Number.NaN, 600],
    [MAX_DOCUMENT_SIZE + 1, 600],
    [800, MAX_DOCUMENT_SIZE + 1],
  ])('rejects the invalid size %s x %s', (width, height) => {
    expect(() => createDocument(width, height)).toThrow(RangeError);
  });

  it(`accepts the largest size, ${MAX_DOCUMENT_SIZE} x ${MAX_DOCUMENT_SIZE}`, () => {
    expect(createDocument(MAX_DOCUMENT_SIZE, MAX_DOCUMENT_SIZE).width).toBe(MAX_DOCUMENT_SIZE);
  });
});

describe('replaceDocument', () => {
  it('gives the same document object the size, layers and active layer of the new one', () => {
    const doc = createDocument(800, 600);
    const next = createDocument(30, 20);

    replaceDocument(doc, next);

    expect([doc.width, doc.height]).toEqual([30, 20]);
    expect(doc.layers).toEqual(next.layers);
    expect(doc.layers[0]).toBe(next.layers[0]);
    expect(doc.activeLayer).toBe(next.activeLayer);
  });

  it('copies the layer list, so changing one document does not change the other', () => {
    const doc = createDocument(800, 600);
    const next = createDocument(30, 20);

    replaceDocument(doc, next);
    doc.layers.pop();

    expect(next.layers).toHaveLength(1);
  });
});
