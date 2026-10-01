import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument, MAX_DOCUMENT_SIZE } from '../../src/renderer/core/document';
import { createLayer } from '../../src/renderer/core/layer';
import { decodeImage, encodeImage, JPEG_BACKGROUND, JPEG_QUALITY } from '../../src/renderer/io/imageFile';

type Call = [name: string, ...args: unknown[]];

// Every canvas made during the test shares one recording context; convertToBlob returns 3 fixed bytes.
function stubCanvases() {
  const calls: Call[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    fillRect(...args: number[]) {
      calls.push(['fillRect', this.fillStyle, ...args]);
    },
    drawImage(image: unknown, ...args: number[]) {
      calls.push(['drawImage', image, this.globalAlpha, ...args]);
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
      convertToBlob = async (options: unknown) => {
        calls.push(['convertToBlob', [this.width, this.height], options]);
        return new Blob([new Uint8Array([1, 2, 3])]);
      };
    },
  );
  return calls;
}

// Fake image decoder: "decodes" any data into a bitmap of the given size, and records if it was freed.
function stubDecoder(width: number, height: number) {
  const bitmap = { width, height, closed: false, close: () => (bitmap.closed = true) };
  vi.stubGlobal('createImageBitmap', async (blob: Blob) => {
    expect(blob).toBeInstanceOf(Blob);
    return bitmap;
  });
  return bitmap;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodeImage', () => {
  let calls: Call[];
  beforeEach(() => {
    calls = stubCanvases();
  });

  it('makes a document of the image size, with one layer named after the file holding the image', async () => {
    const bitmap = stubDecoder(30, 20);

    const doc = await decodeImage('photo.jpg', new Uint8Array([9, 9]));

    expect([doc.width, doc.height]).toEqual([30, 20]);
    expect(doc.layers.map((layer) => layer.name)).toEqual(['photo.jpg']);
    expect(doc.activeLayer).toBe(doc.layers[0]);
    expect(calls).toEqual([['drawImage', bitmap, 1, 0, 0]]);
    expect(bitmap.closed).toBe(true);
  });

  it('refuses an image larger than the maximum, and still frees it', async () => {
    const bitmap = stubDecoder(MAX_DOCUMENT_SIZE + 1, 20);

    await expect(decodeImage('huge.png', new Uint8Array())).rejects.toThrow(RangeError);
    expect(bitmap.closed).toBe(true);
  });
});

describe('encodeImage', () => {
  let calls: Call[];
  beforeEach(() => {
    calls = stubCanvases();
  });

  function makeDocument() {
    const doc = createDocument(30, 20);
    const hidden = createLayer('Hidden', 30, 20);
    hidden.visible = false;
    const top = createLayer('Top', 30, 20);
    top.opacity = 0.5;
    doc.layers.push(hidden, top);
    return { doc, top };
  }

  it('flattens the visible layers into a PNG of the document size, keeping transparency', async () => {
    const { doc, top } = makeDocument();

    const bytes = await encodeImage(doc, 'png');

    expect(calls).toEqual([
      ['drawImage', doc.layers[0].canvas, 1, 0, 0],
      ['drawImage', top.canvas, 0.5, 0, 0],
      ['convertToBlob', [30, 20], { type: 'image/png', quality: JPEG_QUALITY }],
    ]);
    expect([...bytes]).toEqual([1, 2, 3]);
  });

  it('puts a white background under a JPG, which has no transparency', async () => {
    const { doc } = makeDocument();

    await encodeImage(doc, 'jpeg');

    expect(calls[0]).toEqual(['fillRect', JPEG_BACKGROUND, 0, 0, 30, 20]);
    expect(calls.at(-1)).toEqual(['convertToBlob', [30, 20], { type: 'image/jpeg', quality: JPEG_QUALITY }]);
  });
});
