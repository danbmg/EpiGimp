import { applyFilter } from '../core/applyFilter';
import type { Document } from '../core/document';
import type { History } from '../core/history';
import { getLayerContext } from '../core/layer';
import { boxBlur } from '../filters/boxBlur';
import { brightnessContrast, grayscale, invert } from '../filters/colorFilters';
import type { Filter } from '../filters/pixels';
import type { CanvasView } from './canvasView';
import type { FilterDialog, FilterSetting, FilterValues } from './filterDialog';

const BRIGHTNESS_CONTRAST: readonly FilterSetting[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, initial: 0, unit: '' },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, initial: 0, unit: '' },
];
const BLUR: readonly FilterSetting[] = [{ key: 'radius', label: 'Radius', min: 1, max: 50, initial: 3, unit: ' px' }];

// Les commandes du menu Filters. Chaque filtre s'applique au calque actif seulement.
export function initFilterCommands(
  dialog: FilterDialog,
  doc: Document,
  history: History,
  view: CanvasView,
): Record<'grayscale' | 'invert' | 'brightness-contrast' | 'blur', () => void> {
  // Filtre sans réglage : appliqué tout de suite.
  const apply = (filter: Filter): void => {
    applyFilter(doc.activeLayer, history, filter);
    view.requestRender();
  };

  // Filtre à réglages : pendant que la boîte est ouverte, le calque montre un aperçu calculé depuis l'original.
  // L'aperçu n'est pas une action : à la fermeture on remet l'original, puis Apply passe par l'historique.
  const applyWithSettings = async (
    title: string,
    settings: readonly FilterSetting[],
    makeFilter: (values: FilterValues) => Filter,
  ): Promise<void> => {
    const layer = doc.activeLayer;
    const ctx = getLayerContext(layer);
    const original = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    const frame = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);

    const values = await dialog.ask(title, settings, (current) => {
      frame.data.set(makeFilter(current)(original).data);
      ctx.putImageData(frame, 0, 0);
      view.requestRender();
    });
    ctx.putImageData(original, 0, 0);
    if (values) {
      applyFilter(layer, history, makeFilter(values));
    }
    view.requestRender();
  };

  return {
    grayscale: () => apply(grayscale),
    invert: () => apply(invert),
    'brightness-contrast': () =>
      void applyWithSettings('Brightness / Contrast', BRIGHTNESS_CONTRAST, (values) => (image) =>
        brightnessContrast(image, { brightness: values.brightness, contrast: values.contrast }),
      ),
    blur: () => void applyWithSettings('Blur', BLUR, (values) => (image) => boxBlur(image, { radius: values.radius })),
  };
}
