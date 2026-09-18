import type { Point } from '../render/viewport';
import type { StrokeListener } from './strokeRecorder';

export type ToolName = 'brush' | 'eraser';

// Holds every tool and sends each stroke to the one selected in the toolbar.
export class Toolbox implements StrokeListener {
  active: ToolName = 'brush';
  private readonly tools: Record<ToolName, StrokeListener>;

  constructor(tools: Record<ToolName, StrokeListener>) {
    this.tools = tools;
  }

  onStrokeStart(stroke: readonly Point[]): void {
    this.tools[this.active].onStrokeStart?.(stroke);
  }

  onStrokeMove(stroke: readonly Point[]): void {
    this.tools[this.active].onStrokeMove?.(stroke);
  }

  onStrokeEnd(stroke: readonly Point[]): void {
    this.tools[this.active].onStrokeEnd?.(stroke);
  }
}
