import { describe, expect, it } from 'vitest';
import type { Layer } from '../../src/renderer/core/layer';
import {
  MAX_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
  PaintTool,
  toBrushSize,
  type PaintSettings,
} from '../../src/renderer/tools/paintTool';

type Call = [name: string, ...args: unknown[]];

const STATE_KEYS = ['globalCompositeOperation', 'fillStyle', 'strokeStyle', 'lineWidth', 'lineCap'] as const;
type State = Record<(typeof STATE_KEYS)[number], unknown>;

// Fake 2D context that records the path calls, and the drawing state at each fill() / stroke().
// save() / restore() work like the real ones, so a test can check the tool leaves no state behind.
function makeRecordingContext() {
  const calls: Call[] = [];
  const saved: State[] = [];
  const ctx = {
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    state(): State {
      return Object.fromEntries(STATE_KEYS.map((key) => [key, this[key]])) as State;
    },
    save() {
      saved.push(this.state());
      calls.push(['save']);
    },
    restore() {
      Object.assign(this, saved.pop());
      calls.push(['restore']);
    },
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x: number, y: number) => calls.push(['moveTo', x, y]),
    lineTo: (x: number, y: number) => calls.push(['lineTo', x, y]),
    arc: (...args: number[]) => calls.push(['arc', ...args]),
    fill() {
      calls.push(['fill', this.state()]);
    },
    stroke() {
      calls.push(['stroke', this.state()]);
    },
  };
  return { ctx, calls };
}

function makeLayer(name: string) {
  const { ctx, calls } = makeRecordingContext();
  const canvas = { width: 100, height: 100, getContext: () => ctx };
  const layer: Layer = { name, canvas: canvas as unknown as OffscreenCanvas, opacity: 1, visible: true };
  return { layer, ctx, calls };
}

function makeTool(mode: 'paint' | 'erase', settings: PaintSettings = { color: '#ff0000', size: 8 }) {
  const target = makeLayer('Background');
  return { ...target, settings, tool: new PaintTool(mode, () => target.layer, settings) };
}

describe('PaintTool brush', () => {
  it('paints a dot of the brush size at the first point, so a simple click leaves a mark', () => {
    const { tool, calls } = makeTool('paint');

    tool.onStrokeStart([{ x: 10, y: 20 }]);

    expect(calls).toContainEqual(['arc', 10, 20, 4, 0, 2 * Math.PI]);
    const fill = calls.find(([name]) => name === 'fill');
    expect(fill?.[1]).toMatchObject({ globalCompositeOperation: 'source-over', fillStyle: '#ff0000' });
  });

  it('joins only the two newest points with a round line of the brush size', () => {
    const { tool, calls } = makeTool('paint');

    tool.onStrokeMove([
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 300, y: 40 },
    ]);

    const path = calls.filter(([name]) => name === 'moveTo' || name === 'lineTo');
    expect(path).toEqual([
      ['moveTo', 10, 20],
      ['lineTo', 300, 40],
    ]);
    const stroke = calls.find(([name]) => name === 'stroke');
    expect(stroke?.[1]).toEqual({
      globalCompositeOperation: 'source-over',
      fillStyle: '#ff0000',
      strokeStyle: '#ff0000',
      lineWidth: 8,
      lineCap: 'round',
    });
  });

  it('uses the settings as they are at each event', () => {
    const { tool, calls, settings } = makeTool('paint');

    settings.size = 30;
    settings.color = '#00ff00';
    tool.onStrokeMove([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);

    const stroke = calls.find(([name]) => name === 'stroke');
    expect(stroke?.[1]).toMatchObject({ strokeStyle: '#00ff00', lineWidth: 30 });
  });

  it('paints on the layer that is active at each event', () => {
    const first = makeLayer('First');
    const second = makeLayer('Second');
    let active = first.layer;
    const tool = new PaintTool('paint', () => active, { color: '#000000', size: 4 });

    tool.onStrokeStart([{ x: 1, y: 1 }]);
    active = second.layer;
    tool.onStrokeStart([{ x: 2, y: 2 }]);

    expect(first.calls).toContainEqual(['arc', 1, 1, 2, 0, 2 * Math.PI]);
    expect(second.calls).toContainEqual(['arc', 2, 2, 2, 0, 2 * Math.PI]);
    expect(first.calls).not.toContainEqual(['arc', 2, 2, 2, 0, 2 * Math.PI]);
  });

  it('restores the layer context after drawing', () => {
    const { tool, ctx, calls } = makeTool('erase');

    tool.onStrokeStart([{ x: 1, y: 1 }]);
    tool.onStrokeMove([
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ]);

    expect(calls.filter(([name]) => name === 'save')).toHaveLength(2);
    expect(calls.filter(([name]) => name === 'restore')).toHaveLength(2);
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.lineWidth).toBe(1);
  });
});

describe('PaintTool eraser', () => {
  it('removes pixels with destination-out, whatever the current color', () => {
    const { tool, calls } = makeTool('erase', { color: 'rgba(255, 0, 0, 0.1)', size: 12 });

    tool.onStrokeStart([{ x: 5, y: 5 }]);
    tool.onStrokeMove([
      { x: 5, y: 5 },
      { x: 50, y: 5 },
    ]);

    const drawn = calls.filter(([name]) => name === 'fill' || name === 'stroke').map(([, state]) => state);
    expect(drawn).toHaveLength(2);
    for (const state of drawn) {
      // A fully opaque color, so the covered pixels become fully transparent.
      expect(state).toMatchObject({
        globalCompositeOperation: 'destination-out',
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 12,
      });
    }
  });
});

describe('toBrushSize', () => {
  it('rounds to a whole number of pixels', () => {
    expect(toBrushSize(12.4)).toBe(12);
    expect(toBrushSize(12.6)).toBe(13);
  });

  it('keeps the size within the limits', () => {
    expect(toBrushSize(0)).toBe(MIN_BRUSH_SIZE);
    expect(toBrushSize(-5)).toBe(MIN_BRUSH_SIZE);
    expect(toBrushSize(900)).toBe(MAX_BRUSH_SIZE);
  });

  it('rejects values that are not numbers (empty field)', () => {
    expect(toBrushSize(Number.NaN)).toBeNull();
    expect(toBrushSize(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
