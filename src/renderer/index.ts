// Renderer entry point: loaded by index.html and bundled by Vite.
import './styles.css';
import { initMenuBar } from './ui/menuBar';

const menuBar = document.getElementById('menubar');
if (!menuBar) {
  throw new Error('#menubar element is missing from index.html');
}
initMenuBar(menuBar);
