import type { History } from '../core/history';
import type { CanvasView } from './canvasView';

// Boutons Undo / Redo de la barre d'outils : les mêmes actions que Ctrl+Z / Ctrl+Y, grisés quand il n'y a rien à faire.
// Pas besoin de vérifier `isDrawing` comme le clavier : sortir du canvas pour cliquer a déjà terminé le tracé.
export function initHistoryButtons(toolbar: HTMLElement, history: History, view: CanvasView): void {
  const undoButton = toolbar.querySelector<HTMLButtonElement>('#undo-button');
  const redoButton = toolbar.querySelector<HTMLButtonElement>('#redo-button');
  if (!undoButton || !redoButton) {
    throw new Error('#undo-button or #redo-button is missing from index.html');
  }

  undoButton.addEventListener('click', () => {
    if (history.undo()) {
      view.requestRender();
    }
  });
  redoButton.addEventListener('click', () => {
    if (history.redo()) {
      view.requestRender();
    }
  });

  // Les piles changent aussi par un tracé ou par le clavier : History prévient à chaque fois.
  const showState = (): void => {
    undoButton.disabled = !history.canUndo;
    redoButton.disabled = !history.canRedo;
  };
  history.onChange = showState;
  showState();
}
