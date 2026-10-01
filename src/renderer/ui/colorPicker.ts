import type { PaintSettings } from '../tools/paintTool';

// Ce que la pipette peut demander au sélecteur de couleur.
export interface ColorPicker {
  /** Change la couleur courante et l'affiche dans la barre d'outils. */
  setColor(color: string): void;
}

// Sélecteur de la barre d'outils : le carré montre la couleur courante et ouvre le choix, son code est écrit dessous.
export function initColorPicker(toolbar: HTMLElement, settings: PaintSettings): ColorPicker {
  const input = toolbar.querySelector<HTMLInputElement>('#brush-color');
  const code = toolbar.querySelector<HTMLElement>('#brush-color-value');
  if (!input || !code) {
    throw new Error('#brush-color or #brush-color-value is missing from index.html');
  }

  // `input` arrive à chaque mouvement dans le sélecteur, pas seulement à sa fermeture.
  input.addEventListener('input', () => {
    settings.color = input.value;
    code.textContent = settings.color;
  });

  const setColor = (color: string): void => {
    settings.color = color;
    input.value = color;
    code.textContent = color;
  };
  setColor(settings.color);
  return { setColor };
}
