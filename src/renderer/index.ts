// Renderer entry point: loaded by index.html and bundled by Vite.
import './styles.css';
import { createDocument } from './core/document';
import { initCanvasView } from './ui/canvasView';
import { initMenuBar } from './ui/menuBar';

// Until File > New exists (#10), the editor starts with a blank document of this size.
const DEFAULT_DOCUMENT_WIDTH = 800;
const DEFAULT_DOCUMENT_HEIGHT = 600;

initMenuBar(getElement('menubar'));
initCanvasView(getElement('canvas-area'), createDocument(DEFAULT_DOCUMENT_WIDTH, DEFAULT_DOCUMENT_HEIGHT));

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`#${id} element is missing from index.html`);
  }
  return element;
}
