import { vi } from 'vitest';

// Vitest runs in Node, which has no canvas. This fake only records its size, which is enough to test
// the data model; real pixels are checked in the Electron app.
export class FakeOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

// Makes `new OffscreenCanvas(...)` build a FakeOffscreenCanvas. Undo with `vi.unstubAllGlobals()`.
export function stubOffscreenCanvas(): void {
  vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
}
