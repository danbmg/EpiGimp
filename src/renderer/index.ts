// Renderer entry point: loaded by index.html and bundled by Vite.
import './styles.css';
import { createDocument } from './core/document';
import type { Layer } from './core/layer';
import { PaintTool, type PaintSettings } from './tools/paintTool';
import { Toolbox } from './tools/toolbox';
import { initCanvasView } from './ui/canvasView';
import { initMenuBar } from './ui/menuBar';
import { initToolbar } from './ui/toolbar';

// Until File > New exists (#10), the editor starts with a blank document of this size.
const DEFAULT_DOCUMENT_WIDTH = 800;
const DEFAULT_DOCUMENT_HEIGHT = 600;
const DEFAULT_BRUSH_SIZE = 10;

const doc = createDocument(DEFAULT_DOCUMENT_WIDTH, DEFAULT_DOCUMENT_HEIGHT);

// Until the color picker (#8) and the layers panel (#9) exist, the color is black
// and the active layer is the only one: Background.
const paintSettings: PaintSettings = { color: '#000000', size: DEFAULT_BRUSH_SIZE };
const activeLayer = (): Layer => doc.layers[0];
const toolbox = new Toolbox({
  brush: new PaintTool('paint', activeLayer, paintSettings),
  eraser: new PaintTool('erase', activeLayer, paintSettings),
});

initMenuBar(getElement('menubar'));
initToolbar(getElement('toolbar'), toolbox, paintSettings);
initCanvasView(getElement('canvas-area'), doc, toolbox);

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`#${id} element is missing from index.html`);
  }
  return element;
}
