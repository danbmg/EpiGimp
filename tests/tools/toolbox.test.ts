import { describe, expect, it } from 'vitest';
import type { Point } from '../../src/renderer/render/viewport';
import type { StrokeListener } from '../../src/renderer/tools/strokeRecorder';
import { Toolbox } from '../../src/renderer/tools/toolbox';

// Tool that records which stroke events it received.
function makeTool(name: string, log: string[]): StrokeListener {
  return {
    onStrokeStart: (stroke: readonly Point[]) => log.push(`${name} start ${stroke.length}`),
    onStrokeMove: (stroke: readonly Point[]) => log.push(`${name} move ${stroke.length}`),
    onStrokeEnd: (stroke: readonly Point[]) => log.push(`${name} end ${stroke.length}`),
  };
}

describe('Toolbox', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 1, y: 1 };

  it('starts with the brush selected', () => {
    const log: string[] = [];
    const toolbox = new Toolbox({ brush: makeTool('brush', log), eraser: makeTool('eraser', log) });

    toolbox.onStrokeStart([a]);
    toolbox.onStrokeMove([a, b]);
    toolbox.onStrokeEnd([a, b]);

    expect(toolbox.active).toBe('brush');
    expect(log).toEqual(['brush start 1', 'brush move 2', 'brush end 2']);
  });

  it('sends strokes to the selected tool only', () => {
    const log: string[] = [];
    const toolbox = new Toolbox({ brush: makeTool('brush', log), eraser: makeTool('eraser', log) });

    toolbox.active = 'eraser';
    toolbox.onStrokeStart([a]);
    toolbox.active = 'brush';
    toolbox.onStrokeStart([b]);

    expect(log).toEqual(['eraser start 1', 'brush start 1']);
  });
});
