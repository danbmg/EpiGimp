import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLayer } from '../../src/renderer/core/layer';
import { FakeOffscreenCanvas, stubOffscreenCanvas } from '../helpers/fakeOffscreenCanvas';

beforeEach(stubOffscreenCanvas);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createLayer', () => {
  it('creates a visible, fully opaque layer with the given name', () => {
    const layer = createLayer('Layer 1', 40, 30);

    expect(layer.name).toBe('Layer 1');
    expect(layer.opacity).toBe(1);
    expect(layer.visible).toBe(true);
  });

  it('gives the layer an offscreen canvas of the given size', () => {
    const layer = createLayer('Layer 1', 40, 30);

    expect(layer.canvas).toBeInstanceOf(FakeOffscreenCanvas);
    expect(layer.canvas.width).toBe(40);
    expect(layer.canvas.height).toBe(30);
  });

  it('gives each layer its own canvas', () => {
    const a = createLayer('A', 10, 10);
    const b = createLayer('B', 10, 10);

    expect(a.canvas).not.toBe(b.canvas);
  });
});
