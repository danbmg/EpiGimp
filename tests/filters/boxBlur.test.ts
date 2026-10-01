import { describe, expect, it } from 'vitest';
import { boxBlur } from '../../src/renderer/filters/boxBlur';
import type { Pixels } from '../../src/renderer/filters/pixels';

// Image of `width` x `height` pixels, all `[r, g, b, a]` except the ones set by `paint`.
function makeImage(width: number, height: number, background: number[], paint: Record<string, number[]> = {}): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set(paint[`${x},${y}`] ?? background, (y * width + x) * 4);
    }
  }
  return { width, height, data };
}
const at = (image: Pixels, x: number, y: number) => [...image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

describe('boxBlur', () => {
  it('spreads a white dot evenly over a (2r + 1) square, and keeps the total light', () => {
    const dot = makeImage(7, 7, [0, 0, 0, 255], { '3,3': [255, 255, 255, 255] });

    const blurred = boxBlur(dot, { radius: 1 });

    // 255 shared between 9 pixels: about 28 each, inside the 3x3 square only.
    for (const [x, y] of [[2, 2], [3, 2], [4, 4], [3, 3]]) {
      expect(at(blurred, x, y)).toEqual([28, 28, 28, 255]);
    }
    expect(at(blurred, 1, 3)).toEqual([0, 0, 0, 255]);
    expect(at(blurred, 3, 5)).toEqual([0, 0, 0, 255]);
  });

  it('leaves a single-color image unchanged, edges included', () => {
    const flat = makeImage(5, 4, [10, 120, 230, 255]);

    expect([...boxBlur(flat, { radius: 3 }).data]).toEqual([...flat.data]);
  });

  it('does nothing with a radius of 0', () => {
    const dot = makeImage(3, 3, [0, 0, 0, 255], { '1,1': [255, 0, 0, 255] });

    expect([...boxBlur(dot, { radius: 0 }).data]).toEqual([...dot.data]);
  });

  it('keeps the color of a stroke on a transparent layer: no dark halo', () => {
    // A red dot on a fully transparent layer, whose invisible pixels are black (0, 0, 0, 0).
    const dot = makeImage(5, 5, [0, 0, 0, 0], { '2,2': [255, 0, 0, 255] });

    const blurred = boxBlur(dot, { radius: 1 });

    // Next to the dot: still pure red, only more transparent (255 / 9 ≈ 28).
    expect(at(blurred, 1, 2)).toEqual([255, 0, 0, 28]);
    expect(at(blurred, 0, 2)).toEqual([0, 0, 0, 0]);
  });

  it('weighs each color by its opacity: a faint pixel counts less than an opaque one', () => {
    // Opaque red next to a blue at 20 % opacity (alpha 51).
    const pair = makeImage(2, 1, [255, 0, 0, 255], { '1,0': [0, 0, 255, 51] });

    const blurred = boxBlur(pair, { radius: 1 });

    // Window of pixel 0 = [red, red, faint blue]: mostly red, a little blue (a plain average would give 116 of blue).
    expect(at(blurred, 0, 0)).toEqual([232, 0, 23, 187]);
  });

  it('repeats the edge pixels instead of mixing in black outside the image', () => {
    const edge = makeImage(4, 1, [0, 0, 0, 255], { '0,0': [255, 255, 255, 255] });

    const blurred = boxBlur(edge, { radius: 1 });

    // At x = 0 the window is [x = 0 repeated, x = 0, x = 1]: 2 white pixels out of 3.
    expect(at(blurred, 0, 0)).toEqual([170, 170, 170, 255]);
  });

  it('leaves the original image untouched', () => {
    const dot = makeImage(3, 3, [0, 0, 0, 255], { '1,1': [255, 255, 255, 255] });
    const before = [...dot.data];

    boxBlur(dot, { radius: 2 });

    expect([...dot.data]).toEqual(before);
  });
});
