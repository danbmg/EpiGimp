import type { Document } from '../core/document';
import { Compositor } from '../render/compositor';
import { Viewport, type Point } from '../render/viewport';
import { StrokeRecorder, type StrokeListener } from '../tools/strokeRecorder';

/** Changement de zoom par pixel de molette. */
const ZOOM_SPEED = 0.002;

// Crée le canvas visible, dessine `doc` dessus et gère la navigation (zoom, pan) et les tracés.
export function initCanvasView(container: HTMLElement, doc: Document, strokeListener: StrokeListener): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'screen-canvas';
  container.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context is not available for the screen canvas');
  }

  const viewport = new Viewport();
  const compositor = new Compositor(ctx);

  const render = (): void => {
    compositor.render(doc, viewport, window.devicePixelRatio);
  };

  // Ne redessine qu'une fois par frame, même si plusieurs events arrivent entre-temps.
  let renderScheduled = false;
  const requestRender = (): void => {
    if (renderScheduled) {
      return;
    }
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      render();
    });
  };

  const toCanvasPoint = (event: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // --- Redimensionnement ------------------------------------------------------------------------------
  let documentCentered = false;
  new ResizeObserver(() => {
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.round(canvas.clientWidth * pixelRatio);
    canvas.height = Math.round(canvas.clientHeight * pixelRatio);
    if (!documentCentered && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      viewport.centerDocument(doc.width, doc.height, canvas.clientWidth, canvas.clientHeight);
      documentCentered = true;
    }
    render();
  }).observe(canvas);

  // --- Molette : Ctrl + molette zoome, molette seule déplace la vue -----------------------------------
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      if (event.ctrlKey) {
        viewport.zoomAt(toCanvasPoint(event), Math.exp(-event.deltaY * ZOOM_SPEED));
      } else {
        viewport.panBy(-event.deltaX, -event.deltaY);
      }
      requestRender();
    },
    { passive: false },
  );

  // --- Déplacement : Espace + glisser -------------------------------------------------------------------
  let spaceDown = false;
  let lastPanPoint: Point | null = null;

  const updateCursor = (): void => {
    canvas.style.cursor = lastPanPoint ? 'grabbing' : spaceDown ? 'grab' : '';
  };
  const stopPanning = (): void => {
    lastPanPoint = null;
    updateCursor();
  };

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || isTextField(event.target)) {
      return;
    }
    event.preventDefault();
    spaceDown = true;
    updateCursor();
  });
  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space' || isTextField(event.target)) {
      return;
    }
    event.preventDefault();
    spaceDown = false;
    stopPanning();
  });
  window.addEventListener('blur', () => {
    spaceDown = false;
    stopPanning();
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!spaceDown) {
      return;
    }
    lastPanPoint = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    updateCursor();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!lastPanPoint) {
      return;
    }
    viewport.panBy(event.clientX - lastPanPoint.x, event.clientY - lastPanPoint.y);
    lastPanPoint = { x: event.clientX, y: event.clientY };
    requestRender();
  });
  canvas.addEventListener('pointerup', stopPanning);
  canvas.addEventListener('pointercancel', stopPanning);

  // --- Tracés : glisser sans Espace ------------------------------------------------------------------
  const strokes = new StrokeRecorder(viewport, strokeListener);

  canvas.addEventListener('pointerdown', (event) => {
    if (spaceDown || event.button !== 0) {
      return;
    }
    strokes.begin(toCanvasPoint(event));
    requestRender();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!strokes.isRecording) {
      return;
    }
    strokes.add(toCanvasPoint(event));
    requestRender();
  });
  canvas.addEventListener('pointerup', () => strokes.end());
  canvas.addEventListener('pointerleave', () => strokes.end());
  canvas.addEventListener('pointercancel', () => strokes.end());
  window.addEventListener('blur', () => strokes.end());
}

// Un champ texte doit garder la touche Espace pour taper un espace, pas pour activer le déplacement.
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}
