import { describe, expect, it } from 'vitest';
import { brightnessContrast, grayscale, invert } from '../../src/renderer/filters/colorFilters';
import type { Pixels } from '../../src/renderer/filters/pixels';

// An image of a few pixels, given as [r, g, b, a] each.
const image = (...pixels: number[][]): Pixels => ({ width: pixels.length, height: 1, data: new Uint8ClampedArray(pixels.flat()) });
const pixelsOf = (result: Pixels) => Array.from({ length: result.width * result.height }, (_, i) => [...result.data.subarray(i * 4, i * 4 + 4)]);

describe('grayscale', () => {
  it('gives each pixel its brightness, with green counting most and blue least', () => {
    const result = grayscale(image([255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255]));

    expect(pixelsOf(result)).toEqual([
      [76, 76, 76, 255],
      [150, 150, 150, 255],
      [29, 29, 29, 255],
      [255, 255, 255, 255],
    ]);
  });

  it('keeps transparency', () => {
    expect(pixelsOf(grayscale(image([200, 100, 0, 30])))[0][3]).toBe(30);
  });
});

describe('invert', () => {
  it('turns each color into its opposite and keeps transparency', () => {
    expect(pixelsOf(invert(image([0, 128, 255, 77])))).toEqual([[255, 127, 0, 77]]);
  });

  it('gives back the original image when applied twice', () => {
    const original = image([12, 34, 56, 78], [200, 0, 99, 255]);

    expect(pixelsOf(invert(invert(original)))).toEqual(pixelsOf(original));
  });
});

describe('brightnessContrast', () => {
  const sample = image([0, 64, 128, 255], [192, 255, 100, 40]);

  it('changes nothing at 0 / 0', () => {
    expect(pixelsOf(brightnessContrast(sample, { brightness: 0, contrast: 0 }))).toEqual(pixelsOf(sample));
  });

  it('brightness shifts every color, and stops at black and white', () => {
    expect(pixelsOf(brightnessContrast(sample, { brightness: 20, contrast: 0 }))[0]).toEqual([51, 115, 179, 255]);
    expect(pixelsOf(brightnessContrast(sample, { brightness: 100, contrast: 0 }))[0]).toEqual([255, 255, 255, 255]);
    expect(pixelsOf(brightnessContrast(sample, { brightness: -100, contrast: 0 }))[0]).toEqual([0, 0, 0, 255]);
  });

  it('contrast moves colors away from the middle grey, or towards it', () => {
    expect(pixelsOf(brightnessContrast(sample, { brightness: 0, contrast: 50 }))[0]).toEqual([0, 32, 128, 255]);
    expect(pixelsOf(brightnessContrast(sample, { brightness: 0, contrast: -100 }))[0]).toEqual([128, 128, 128, 255]);
  });

  it('keeps transparency', () => {
    expect(pixelsOf(brightnessContrast(sample, { brightness: 50, contrast: 50 }))[1][3]).toBe(40);
  });
});

describe('every color filter', () => {
  it.each([
    ['grayscale', grayscale],
    ['invert', invert],
    ['brightnessContrast', (input: Pixels) => brightnessContrast(input, { brightness: 30, contrast: 30 })],
  ])('%s leaves the original image untouched', (_, filter) => {
    const original = image([10, 20, 30, 255]);

    filter(original);

    expect([...original.data]).toEqual([10, 20, 30, 255]);
  });
});
