import { describe, expect, it } from 'vitest';
import { MAX_SCALE, MIN_SCALE, Viewport } from '../../src/renderer/render/viewport';

function makeViewport(scale: number, offsetX: number, offsetY: number): Viewport {
  const viewport = new Viewport();
  viewport.scale = scale;
  viewport.offsetX = offsetX;
  viewport.offsetY = offsetY;
  return viewport;
}

describe('Viewport coordinate conversion', () => {
  it('is the identity by default', () => {
    const viewport = new Viewport();

    expect(viewport.screenToDoc({ x: 12, y: 34 })).toEqual({ x: 12, y: 34 });
    expect(viewport.docToScreen({ x: 12, y: 34 })).toEqual({ x: 12, y: 34 });
  });

  it('applies scale then offset from document to screen', () => {
    const viewport = makeViewport(2, 100, 50);

    expect(viewport.docToScreen({ x: 10, y: 20 })).toEqual({ x: 120, y: 90 });
  });

  it('removes offset then scale from screen to document', () => {
    const viewport = makeViewport(2, 100, 50);

    expect(viewport.screenToDoc({ x: 120, y: 90 })).toEqual({ x: 10, y: 20 });
  });

  it('round-trips a point through both conversions', () => {
    const viewport = makeViewport(0.37, -12.5, 48.25);
    const back = viewport.screenToDoc(viewport.docToScreen({ x: 321.5, y: 7 }));

    expect(back.x).toBeCloseTo(321.5);
    expect(back.y).toBeCloseTo(7);
  });
});

describe('Viewport.zoomAt', () => {
  it('multiplies the scale by the factor', () => {
    const viewport = makeViewport(1, 0, 0);

    viewport.zoomAt({ x: 0, y: 0 }, 2);

    expect(viewport.scale).toBe(2);
  });

  it('keeps the document point under the mouse at the same screen position', () => {
    const viewport = makeViewport(1.5, 40, -30);
    const mouse = { x: 250, y: 180 };
    const docPointBefore = viewport.screenToDoc(mouse);

    viewport.zoomAt(mouse, 1.7);

    const docPointAfter = viewport.screenToDoc(mouse);
    expect(docPointAfter.x).toBeCloseTo(docPointBefore.x);
    expect(docPointAfter.y).toBeCloseTo(docPointBefore.y);
  });

  it('comes back to the same view when zooming in then out by inverse factors', () => {
    const viewport = makeViewport(1, 10, 20);

    viewport.zoomAt({ x: 300, y: 200 }, Math.exp(0.2));
    viewport.zoomAt({ x: 300, y: 200 }, Math.exp(-0.2));

    expect(viewport.scale).toBeCloseTo(1);
    expect(viewport.offsetX).toBeCloseTo(10);
    expect(viewport.offsetY).toBeCloseTo(20);
  });

  it('never zooms beyond the minimum and maximum scale', () => {
    const viewport = new Viewport();

    viewport.zoomAt({ x: 0, y: 0 }, 1e6);
    expect(viewport.scale).toBe(MAX_SCALE);

    viewport.zoomAt({ x: 0, y: 0 }, 1e-6);
    expect(viewport.scale).toBe(MIN_SCALE);
  });
});

describe('Viewport.panBy', () => {
  it('moves the offset by the drag distance without changing the scale', () => {
    const viewport = makeViewport(3, 10, 20);

    viewport.panBy(15, -40);

    expect(viewport.offsetX).toBe(25);
    expect(viewport.offsetY).toBe(-20);
    expect(viewport.scale).toBe(3);
  });
});

describe('Viewport.centerDocument', () => {
  it('shows a document that fits at 100%, centered', () => {
    const viewport = new Viewport();

    viewport.centerDocument(800, 600, 1000, 700);

    expect(viewport.scale).toBe(1);
    expect(viewport.offsetX).toBe(100);
    expect(viewport.offsetY).toBe(50);
  });

  it('shrinks a document that is too big so it fits, centered', () => {
    const viewport = new Viewport();

    viewport.centerDocument(2000, 1000, 540, 440);

    // Limited by the width: (540 - 2 * 20) / 2000 = 0.25
    expect(viewport.scale).toBeCloseTo(0.25);
    expect(viewport.offsetX).toBeCloseTo(20);
    expect(viewport.offsetY).toBeCloseTo((440 - 250) / 2);
  });
});
