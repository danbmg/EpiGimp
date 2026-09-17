import type { Document } from '../core/document';
import { Compositor } from '../render/compositor';
import { Viewport, type Point } from '../render/viewport';

/** Zoom change per wheel pixel: one mouse wheel notch (deltaY = 100) zooms by about 22%. */
const ZOOM_SPEED = 0.002;

// Creates the visible canvas inside `container`, draws `doc` on it and handles navigation:
// Ctrl + wheel zooms, Space + drag pans.
export function initCanvasView(container: HTMLElement, doc: Document): void {
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

  // Input events can fire many times per frame: redraw at most once per frame.
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

  // Screen position of a mouse event, relative to the canvas top-left corner.
  const toCanvasPoint = (event: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // --- Resize ---------------------------------------------------------------------------------------
  // The canvas buffer must have as many pixels as the canvas has on screen (CSS size x devicePixelRatio),
  // otherwise the browser stretches it and the image gets blurry.
  let documentCentered = false;
  new ResizeObserver(() => {
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.round(canvas.clientWidth * pixelRatio);
    canvas.height = Math.round(canvas.clientHeight * pixelRatio);
    if (!documentCentered && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      viewport.centerDocument(doc.width, doc.height, canvas.clientWidth, canvas.clientHeight);
      documentCentered = true;
    }
    // Resizing the buffer erases the canvas: redraw now rather than next frame, to avoid a blank flash.
    render();
  }).observe(canvas);

  // --- Zoom: Ctrl + wheel -------------------------------------------------------------------------
  canvas.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey) {
        return;
      }
      // Without this, Chromium would zoom the whole page instead.
      event.preventDefault();
      // exp() makes zooming in then out by the same wheel amount return exactly to the previous zoom.
      viewport.zoomAt(toCanvasPoint(event), Math.exp(-event.deltaY * ZOOM_SPEED));
      requestRender();
    },
    // preventDefault() is ignored in passive listeners.
    { passive: false },
  );

  // --- Pan: Space + drag --------------------------------------------------------------------------
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
    // Space would otherwise press the focused button (e.g. the File menu after clicking it).
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
  // Releasing Space in another window never sends keyup here: reset when the window loses focus.
  window.addEventListener('blur', () => {
    spaceDown = false;
    stopPanning();
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!spaceDown) {
      return;
    }
    lastPanPoint = { x: event.clientX, y: event.clientY };
    // Keep receiving pointer events even if the mouse leaves the canvas during the drag.
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
}

// Space must keep typing spaces in text fields (e.g. future dialogs).
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}
