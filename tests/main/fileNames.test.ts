import { describe, expect, it } from 'vitest';
import { withExtension } from '../../src/main/fileNames';

describe('withExtension', () => {
  it('adds the extension of the format when the name has none', () => {
    expect(withExtension('/home/dan/drawing', 'png')).toBe('/home/dan/drawing.png');
    expect(withExtension('/home/dan/drawing', 'jpeg')).toBe('/home/dan/drawing.jpg');
  });

  it('keeps a name that already has a matching extension, whatever its case', () => {
    expect(withExtension('/home/dan/drawing.png', 'png')).toBe('/home/dan/drawing.png');
    expect(withExtension('/home/dan/photo.JPEG', 'jpeg')).toBe('/home/dan/photo.JPEG');
  });

  it('adds the right extension when the name has another one', () => {
    expect(withExtension('/home/dan/photo.jpg', 'png')).toBe('/home/dan/photo.jpg.png');
    expect(withExtension('/home/dan/v1.2', 'png')).toBe('/home/dan/v1.2.png');
  });
});
