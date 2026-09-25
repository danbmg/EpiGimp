import type { Point } from '../render/viewport';
import type { StrokeListener } from './strokeRecorder';

export type ToolName = 'brush' | 'eraser';

// Garde tous les outils et transmet chaque tracé à celui sélectionné dans la barre d'outils.
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
