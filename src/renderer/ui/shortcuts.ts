import type { History } from '../core/history';
import { isTextField, type CanvasView } from './canvasView';

// Ctrl+Z annule, Ctrl+Y rétablit. `event.key` suit la disposition du clavier : Ctrl+Z marche aussi en AZERTY.
export function initHistoryShortcuts(history: History, view: CanvasView): void {
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || event.shiftKey || event.altKey || isTextField(event.target)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key !== 'z' && key !== 'y') {
      return;
    }
    event.preventDefault();
    // Annuler en plein tracé remettrait l'ancien calque sous un tracé qui continue de peindre.
    if (view.isDrawing) {
      return;
    }
    const changed = key === 'z' ? history.undo() : history.redo();
    if (changed) {
      view.requestRender();
    }
  });
}
