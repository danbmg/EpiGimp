import { describe, expect, it } from 'vitest';
import type { Point } from '../../src/renderer/render/viewport';
import type { StrokeListener } from '../../src/renderer/tools/strokeRecorder';
import { isToolName, TOOL_NAMES, Toolbox } from '../../src/renderer/tools/toolbox';

// Tool that records which stroke events it received.
function makeTool(name: string, log: string[]): StrokeListener {
  return {
    onStrokeStart: (stroke: readonly Point[]) => log.push(`${name} start ${stroke.length}`),
    onStrokeMove: (stroke: readonly Point[]) => log.push(`${name} move ${stroke.length}`),
    onStrokeEnd: (stroke: readonly Point[]) => log.push(`${name} end ${stroke.length}`),
  };
}

function makeToolbox(log: string[]): Toolbox {
  return new Toolbox({
    brush: makeTool('brush', log),
    eraser: makeTool('eraser', log),
    eyedropper: makeTool('eyedropper', log),
  });
}

describe('Toolbox', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 1, y: 1 };

  it('starts with the brush selected', () => {
    const log: string[] = [];
    const toolbox = makeToolbox(log);

    toolbox.onStrokeStart([a]);
    toolbox.onStrokeMove([a, b]);
    toolbox.onStrokeEnd([a, b]);

    expect(toolbox.active).toBe('brush');
    expect(log).toEqual(['brush start 1', 'brush move 2', 'brush end 2']);
  });

  it('sends strokes to the selected tool only', () => {
    const log: string[] = [];
    const toolbox = makeToolbox(log);

    toolbox.active = 'eraser';
    toolbox.onStrokeStart([a]);
    toolbox.active = 'eyedropper';
    toolbox.onStrokeStart([b]);
    toolbox.active = 'brush';
    toolbox.onStrokeStart([b]);

    expect(log).toEqual(['eraser start 1', 'eyedropper start 1', 'brush start 1']);
  });
});

describe('isToolName', () => {
  it('accepts every tool name', () => {
    expect(TOOL_NAMES.every(isToolName)).toBe(true);
  });

  it('rejects unknown or missing names', () => {
    expect(isToolName('bucket')).toBe(false);
    expect(isToolName('')).toBe(false);
    expect(isToolName(undefined)).toBe(false);
  });
});
