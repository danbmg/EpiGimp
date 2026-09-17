import { vi } from 'vitest';

// Vitest runs in Node, which has no canvas. This fake records its size and accepts drawing calls without
// producing pixels, which is enough to test the logic; real pixels are checked in the Electron app.
export class FakeOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(): { fillStyle: string; fillRect: () => void } {
    return { fillStyle: '', fillRect: () => undefined };
  }
}

// Makes `new OffscreenCanvas(...)` build a FakeOffscreenCanvas. Undo with `vi.unstubAllGlobals()`.
export function stubOffscreenCanvas(): void {
  vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
}
