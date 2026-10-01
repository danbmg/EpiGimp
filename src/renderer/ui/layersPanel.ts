import type { Document } from '../core/document';
import type { History } from '../core/history';
import type { Layer } from '../core/layer';
import { addLayer, deleteLayer, moveLayer } from '../core/layerActions';
import type { CanvasView } from './canvasView';

// Icônes de l'œil (SVG constants, aucune donnée utilisateur dedans).
const EYE_OPEN =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_CLOSED =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>';

// Panneau de droite : les calques (le plus haut en premier), l'opacité du calque actif, Add / Delete.
// Comme le Compositor pour le canvas, la liste est entièrement reconstruite à chaque changement.
export function initLayersPanel(panel: HTMLElement, doc: Document, history: History, view: CanvasView): void {
  const list = query<HTMLUListElement>(panel, '#layer-list');
  const opacity = query<HTMLInputElement>(panel, '#layer-opacity');
  const opacityValue = query<HTMLElement>(panel, '#layer-opacity-value');
  const addButton = query<HTMLButtonElement>(panel, '#add-layer');
  const deleteButton = query<HTMLButtonElement>(panel, '#delete-layer');

  /** Le calque en cours de glisser-déposer. */
  let dragged: Layer | null = null;

  const render = (): void => {
    list.replaceChildren(...[...doc.layers].reverse().map(createRow));
    opacity.valueAsNumber = Math.round(doc.activeLayer.opacity * 100);
    opacityValue.textContent = `${opacity.value}%`;
    deleteButton.disabled = doc.layers.length <= 1;
  };

  // Après chaque modification : le panneau et le canvas montrent tout de suite le nouvel état.
  const changed = (): void => {
    render();
    view.requestRender();
  };

  const createRow = (layer: Layer): HTMLLIElement => {
    const row = document.createElement('li');
    row.className = 'layer-row';
    row.role = 'option';
    row.draggable = true;
    row.setAttribute('aria-selected', String(layer === doc.activeLayer));

    const eye = document.createElement('button');
    eye.className = 'layer-eye';
    eye.innerHTML = layer.visible ? EYE_OPEN : EYE_CLOSED;
    eye.title = layer.visible ? 'Hide layer' : 'Show layer';
    eye.setAttribute('aria-pressed', String(layer.visible));
    eye.addEventListener('click', (event) => {
      event.stopPropagation(); // l'œil ne change pas le calque actif
      layer.visible = !layer.visible;
      changed();
    });

    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = layer.name;
    row.append(eye, name);

    row.addEventListener('click', () => {
      doc.activeLayer = layer;
      render();
    });

    // --- Glisser-déposer : la ligne survolée montre où le calque va arriver ---------------------------
    row.addEventListener('dragstart', (event) => {
      dragged = layer;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    });
    row.addEventListener('dragover', (event) => {
      if (!dragged || dragged === layer) {
        return;
      }
      event.preventDefault(); // sans ça, le navigateur refuse le dépôt sur cette ligne
      row.dataset.drop = dropPosition(event, row);
    });
    row.addEventListener('dragleave', () => {
      delete row.dataset.drop;
    });
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const moved = dragged;
      dragged = null;
      if (moved) {
        moveLayer(doc, history, moved, layer, dropPosition(event, row));
      }
      changed();
    });
    // Lâché ailleurs que sur une ligne : on efface juste les marques.
    row.addEventListener('dragend', () => {
      dragged = null;
      render();
    });
    return row;
  };

  addButton.addEventListener('click', () => {
    addLayer(doc, history);
    changed();
  });
  deleteButton.addEventListener('click', () => {
    deleteLayer(doc, history);
    changed();
  });
  // `input` : l'image change pendant qu'on glisse le curseur, pas seulement quand on le lâche.
  opacity.addEventListener('input', () => {
    doc.activeLayer.opacity = opacity.valueAsNumber / 100;
    opacityValue.textContent = `${opacity.value}%`;
    view.requestRender();
  });

  // Un Ctrl+Z peut remettre ou retirer des calques : la liste est redessinée après chaque changement de l'historique.
  history.subscribe(render);
  render();
}

// Moitié haute de la ligne = au-dessus de ce calque, moitié basse = en dessous (la liste montre le haut en premier).
function dropPosition(event: DragEvent, row: HTMLElement): 'above' | 'below' {
  const rect = row.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
}

// Récupère un élément du panneau, ou échoue au démarrage s'il manque dans index.html.
function query<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing from index.html`);
  }
  return element;
}
