// Point d'entrée du renderer, chargé par index.html.
import './styles.css';
import { createDocument } from './core/document';
import { History } from './core/history';
import type { Layer } from './core/layer';
import { Eyedropper } from './tools/eyedropper';
import { PaintTool, type PaintSettings } from './tools/paintTool';
import { Toolbox } from './tools/toolbox';
import { initCanvasView } from './ui/canvasView';
import { initColorPicker } from './ui/colorPicker';
import { initFileCommands } from './ui/fileCommands';
import { initHistoryButtons } from './ui/historyButtons';
import { initLayersPanel } from './ui/layersPanel';
import { initMenuBar } from './ui/menuBar';
import { initNewDocumentDialog } from './ui/newDocumentDialog';
import { initHistoryShortcuts } from './ui/shortcuts';
import { initToolbar } from './ui/toolbar';

const DEFAULT_DOCUMENT_WIDTH = 800;
const DEFAULT_DOCUMENT_HEIGHT = 600;
const DEFAULT_BRUSH_SIZE = 10;
const DEFAULT_COLOR = '#000000';

const doc = createDocument(DEFAULT_DOCUMENT_WIDTH, DEFAULT_DOCUMENT_HEIGHT);
const history = new History();

const paintSettings: PaintSettings = { color: DEFAULT_COLOR, size: DEFAULT_BRUSH_SIZE };
// Relu à chaque coup de pinceau : les outils peignent sur le calque choisi dans le panneau.
const activeLayer = (): Layer => doc.activeLayer;

// Créé avant les outils : la pipette lui envoie la couleur qu'elle a lue.
const toolbar = getElement('toolbar');
const colorPicker = initColorPicker(toolbar, paintSettings);
const toolbox = new Toolbox({
  brush: new PaintTool('paint', activeLayer, paintSettings, history),
  eraser: new PaintTool('erase', activeLayer, paintSettings, history),
  eyedropper: new Eyedropper(doc, (color) => colorPicker.setColor(color)),
});

initToolbar(toolbar, toolbox, paintSettings);
const canvasView = initCanvasView(getElement('canvas-area'), doc, toolbox);
initHistoryShortcuts(history, canvasView);
initHistoryButtons(toolbar, history, canvasView);
initLayersPanel(getElement('layers-panel'), doc, history, canvasView);
const newDialog = initNewDocumentDialog(getElement('new-dialog'));
initMenuBar(getElement('menubar'), initFileCommands(newDialog, doc, history, canvasView));

// Récupère un élément de index.html, ou échoue tout de suite s'il manque.
function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`#${id} element is missing from index.html`);
  }
  return element;
}
