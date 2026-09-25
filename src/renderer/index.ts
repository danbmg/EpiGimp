// Point d'entrée du renderer, chargé par index.html.
import './styles.css';
import { createDocument } from './core/document';
import type { Layer } from './core/layer';
import { PaintTool, type PaintSettings } from './tools/paintTool';
import { Toolbox } from './tools/toolbox';
import { initCanvasView } from './ui/canvasView';
import { initMenuBar } from './ui/menuBar';
import { initToolbar } from './ui/toolbar';

const DEFAULT_DOCUMENT_WIDTH = 800;
const DEFAULT_DOCUMENT_HEIGHT = 600;
const DEFAULT_BRUSH_SIZE = 10;

const doc = createDocument(DEFAULT_DOCUMENT_WIDTH, DEFAULT_DOCUMENT_HEIGHT);

// Noir et calque de fond en attendant le sélecteur de couleur (#8) et le panneau des calques (#9).
const paintSettings: PaintSettings = { color: '#000000', size: DEFAULT_BRUSH_SIZE };
const activeLayer = (): Layer => doc.layers[0];
const toolbox = new Toolbox({
  brush: new PaintTool('paint', activeLayer, paintSettings),
  eraser: new PaintTool('erase', activeLayer, paintSettings),
});

initMenuBar(getElement('menubar'));
initToolbar(getElement('toolbar'), toolbox, paintSettings);
initCanvasView(getElement('canvas-area'), doc, toolbox);

// Récupère un élément de index.html, ou échoue tout de suite s'il manque.
function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`#${id} element is missing from index.html`);
  }
  return element;
}
