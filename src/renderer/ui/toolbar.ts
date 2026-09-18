import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE, toBrushSize, type PaintSettings } from '../tools/paintTool';
import type { ToolName, Toolbox } from '../tools/toolbox';

// Left toolbar: one button per tool (the pressed one is active) and the brush size, shared by brush and eraser.
export function initToolbar(toolbar: HTMLElement, toolbox: Toolbox, settings: PaintSettings): void {
  // --- Tool buttons: `data-tool` in index.html names the tool ------------------------------------
  const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>('[data-tool]')].map((button) => ({
    button,
    tool: toToolName(button.dataset.tool),
  }));

  const showActiveTool = (): void => {
    buttons.forEach(({ button, tool }) => button.setAttribute('aria-pressed', String(tool === toolbox.active)));
  };
  buttons.forEach(({ button, tool }) => {
    button.addEventListener('click', () => {
      toolbox.active = tool;
      showActiveTool();
    });
  });
  showActiveTool();

  // --- Brush size ---------------------------------------------------------------------------------
  const sizeInput = toolbar.querySelector<HTMLInputElement>('#brush-size');
  if (!sizeInput) {
    throw new Error('#brush-size input is missing from index.html');
  }
  sizeInput.min = String(MIN_BRUSH_SIZE);
  sizeInput.max = String(MAX_BRUSH_SIZE);
  sizeInput.value = String(settings.size);

  // Applied while typing or clicking the arrows, so the next stroke already uses it.
  sizeInput.addEventListener('input', () => {
    const size = toBrushSize(sizeInput.valueAsNumber);
    if (size !== null) {
      settings.size = size;
    }
  });
  // When the field is left or Enter is pressed, show the size really used (e.g. 900 becomes 500).
  sizeInput.addEventListener('change', () => {
    sizeInput.value = String(settings.size);
  });
}

// Fails at startup, rather than on click, if index.html names a tool that does not exist.
function toToolName(value: string | undefined): ToolName {
  if (value !== 'brush' && value !== 'eraser') {
    throw new Error(`Unknown tool "${value}" in index.html`);
  }
  return value;
}
