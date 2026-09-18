import { describe, expect, it } from 'vitest';
import type { Point } from '../../src/renderer/render/viewport';
import { Viewport } from '../../src/renderer/render/viewport';
import { StrokeRecorder, type StrokeListener } from '../../src/renderer/tools/strokeRecorder';

type Call = [event: 'start' | 'move' | 'end', stroke: Point[]];

// Listener that records every call, with a copy of the stroke as it was at that time.
function makeRecorder(viewport = new Viewport()) {
  const calls: Call[] = [];
  const listener: StrokeListener = {
    onStrokeStart: (stroke) => calls.push(['start', [...stroke]]),
    onStrokeMove: (stroke) => calls.push(['move', [...stroke]]),
    onStrokeEnd: (stroke) => calls.push(['end', [...stroke]]),
  };
  return { calls, recorder: new StrokeRecorder(viewport, listener) };
}

describe('StrokeRecorder', () => {
  it('records pointer down, moves and up as one list of points, in order', () => {
    const { calls, recorder } = makeRecorder();

    recorder.begin({ x: 1, y: 2 });
    recorder.add({ x: 3, y: 4 });
    recorder.add({ x: 5, y: 6 });
    recorder.end();

    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    const c = { x: 5, y: 6 };
    expect(calls).toEqual([
      ['start', [a]],
      ['move', [a, b]],
      ['move', [a, b, c]],
      ['end', [a, b, c]],
    ]);
  });

  it('stores points in document coordinates', () => {
    const viewport = new Viewport();
    viewport.scale = 2;
    viewport.offsetX = 100;
    viewport.offsetY = 50;
    const { calls, recorder } = makeRecorder(viewport);

    recorder.begin({ x: 120, y: 90 });
    recorder.add({ x: 100, y: 50 });
    recorder.end();

    expect(calls.at(-1)).toEqual(['end', [{ x: 10, y: 20 }, { x: 0, y: 0 }]]);
  });

  it('keeps earlier points right when the zoom changes mid-stroke', () => {
    const viewport = new Viewport();
    const { calls, recorder } = makeRecorder(viewport);

    recorder.begin({ x: 40, y: 40 });
    viewport.zoomAt({ x: 0, y: 0 }, 4);
    recorder.add({ x: 40, y: 40 });
    recorder.end();

    // Same screen point, but after zooming x4 it covers a document point 4 times closer to the origin.
    expect(calls.at(-1)).toEqual(['end', [{ x: 40, y: 40 }, { x: 10, y: 10 }]]);
  });

  it('ignores moves and releases when no stroke is in progress', () => {
    const { calls, recorder } = makeRecorder();

    recorder.add({ x: 1, y: 1 });
    recorder.end();

    expect(calls).toEqual([]);
    expect(recorder.isRecording).toBe(false);
  });

  it('ends a stroke only once (pointerleave then pointerup)', () => {
    const { calls, recorder } = makeRecorder();

    recorder.begin({ x: 1, y: 1 });
    expect(recorder.isRecording).toBe(true);
    recorder.end();
    recorder.add({ x: 2, y: 2 });
    recorder.end();

    expect(calls).toEqual([
      ['start', [{ x: 1, y: 1 }]],
      ['end', [{ x: 1, y: 1 }]],
    ]);
    expect(recorder.isRecording).toBe(false);
  });

  it('starts each stroke with a fresh list of points', () => {
    const strokes: (readonly Point[])[] = [];
    const recorder = new StrokeRecorder(new Viewport(), { onStrokeEnd: (stroke) => strokes.push(stroke) });

    recorder.begin({ x: 1, y: 1 });
    recorder.end();
    recorder.begin({ x: 2, y: 2 });
    recorder.add({ x: 3, y: 3 });
    recorder.end();

    expect(strokes).toEqual([[{ x: 1, y: 1 }], [{ x: 2, y: 2 }, { x: 3, y: 3 }]]);
  });

  it('ends the current stroke when a new one begins', () => {
    const { calls, recorder } = makeRecorder();

    recorder.begin({ x: 1, y: 1 });
    recorder.begin({ x: 2, y: 2 });

    expect(calls).toEqual([
      ['start', [{ x: 1, y: 1 }]],
      ['end', [{ x: 1, y: 1 }]],
      ['start', [{ x: 2, y: 2 }]],
    ]);
  });
});
