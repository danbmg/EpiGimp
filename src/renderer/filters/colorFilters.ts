import type { Pixels } from './pixels';

// Les filtres de couleur changent chaque pixel seul, sans regarder ses voisins. L'alpha (data[i + 3]) ne change pas.
// Ils écrivent dans une copie : Uint8ClampedArray arrondit et borne lui-même chaque valeur entre 0 et 255.

// Niveaux de gris : chaque pixel prend sa luminosité. L'œil voit le vert plus clair que le rouge, et le bleu
// plus sombre : d'où les poids 0,299 / 0,587 / 0,114 (norme vidéo Rec. 601) plutôt qu'une simple moyenne.
export function grayscale(image: Pixels): Pixels {
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return { width: image.width, height: image.height, data };
}

// Négatif : chaque couleur devient son complément (0 ↔ 255).
export function invert(image: Pixels): Pixels {
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return { width: image.width, height: image.height, data };
}

export interface BrightnessContrast {
  /** De -100 (tout noir) à 100 (tout blanc) ; 0 ne change rien. */
  brightness: number;
  /** De -100 (tout gris) à 100 (écarts doublés) ; 0 ne change rien. */
  contrast: number;
}

// Le contraste écarte (ou rapproche) chaque valeur du gris moyen 128, puis la luminosité ajoute un décalage.
export function brightnessContrast(image: Pixels, { brightness, contrast }: BrightnessContrast): Pixels {
  const factor = 1 + contrast / 100;
  const offset = (brightness / 100) * 255;
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    for (let channel = i; channel < i + 3; channel++) {
      data[channel] = (data[channel] - 128) * factor + 128 + offset;
    }
  }
  return { width: image.width, height: image.height, data };
}
