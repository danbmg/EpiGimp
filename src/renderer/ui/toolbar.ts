import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE, toBrushSize, type PaintSettings } from '../tools/paintTool';
import type { ToolName, Toolbox } from '../tools/toolbox';

// Barre d'outils de gauche : un bouton par outil et la taille du pinceau, partagée avec la gomme.
export function initToolbar(toolbar: HTMLElement, toolbox: Toolbox, settings: PaintSettings): void {
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

  const sizeInput = toolbar.querySelector<HTMLInputElement>('#brush-size');
  if (!sizeInput) {
    throw new Error('#brush-size input is missing from index.html');
  }
  sizeInput.min = String(MIN_BRUSH_SIZE);
  sizeInput.max = String(MAX_BRUSH_SIZE);
  sizeInput.value = String(settings.size);

  sizeInput.addEventListener('input', () => {
    const size = toBrushSize(sizeInput.valueAsNumber);
    if (size !== null) {
      settings.size = size;
    }
  });
  // Si le champ contenait une valeur hors bornes, on réaffiche la taille réellement appliquée.
  sizeInput.addEventListener('change', () => {
    sizeInput.value = String(settings.size);
  });
}

// Échoue au démarrage plutôt qu'au clic si `index.html` référence un outil inconnu.
function toToolName(value: string | undefined): ToolName {
  if (value !== 'brush' && value !== 'eraser') {
    throw new Error(`Unknown tool "${value}" in index.html`);
  }
  return value;
}
