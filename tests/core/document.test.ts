import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument } from '../../src/renderer/core/document';
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

  it.each([
    [0, 600],
    [800, 0],
    [-1, 600],
    [800.5, 600],
    [Number.NaN, 600],
  ])('rejects the invalid size %s x %s', (width, height) => {
    expect(() => createDocument(width, height)).toThrow(RangeError);
  });
});
