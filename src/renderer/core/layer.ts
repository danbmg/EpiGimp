// A layer is one sheet of pixels of the document. It owns its own offscreen canvas (never attached
// to the page): tools draw on it, and the compositor copies it onto the visible canvas.
export interface Layer {
  name: string;
  canvas: OffscreenCanvas;
  /** From 0 (invisible) to 1 (fully opaque), used as `globalAlpha` when compositing. */
  opacity: number;
  visible: boolean;
}

// A freshly created canvas is fully transparent, so a new layer starts empty.
export function createLayer(name: string, width: number, height: number): Layer {
  return {
    name,
    canvas: new OffscreenCanvas(width, height),
    opacity: 1,
    visible: true,
  };
}
