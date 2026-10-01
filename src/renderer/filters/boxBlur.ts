import type { Pixels } from './pixels';

export interface BlurSettings {
  /** Rayon en pixels : chaque pixel devient la moyenne d'un carré de (2 × rayon + 1) pixels de côté. */
  radius: number;
}

// Flou « boîte » : chaque pixel prend la moyenne de ses voisins dans un carré centré sur lui.
// Fait en 2 passes, une ligne puis une colonne, ce qui revient au même qu'un carré mais coûte bien moins cher.
export function boxBlur(image: Pixels, { radius }: BlurSettings): Pixels {
  const { width, height } = image;
  const r = Math.round(radius);
  if (r <= 0) {
    return { width, height, data: new Uint8ClampedArray(image.data) };
  }

  // 1. Couleurs « prémultipliées » : multipliées par l'alpha. Sinon, les pixels transparents (noirs invisibles)
  //    entreraient dans la moyenne avec leur noir, et un trait flouté sur un calque transparent aurait un halo sombre.
  const premultiplied = new Float32Array(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    const alpha = image.data[i + 3] / 255;
    premultiplied[i] = image.data[i] * alpha;
    premultiplied[i + 1] = image.data[i + 1] * alpha;
    premultiplied[i + 2] = image.data[i + 2] * alpha;
    premultiplied[i + 3] = image.data[i + 3];
  }

  // 2. Moyenne le long de chaque ligne, puis de chaque colonne.
  const rows = blurLines(premultiplied, { lines: height, length: width, lineStep: width * 4, pixelStep: 4 }, r);
  const blurred = blurLines(rows, { lines: width, length: height, lineStep: 4, pixelStep: width * 4 }, r);

  // 3. Retour aux couleurs normales : on redivise par l'alpha moyen obtenu.
  const data = new Uint8ClampedArray(image.data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = blurred[i + 3];
    if (alpha > 0) {
      data[i] = blurred[i] / (alpha / 255);
      data[i + 1] = blurred[i + 1] / (alpha / 255);
      data[i + 2] = blurred[i + 2] / (alpha / 255);
      data[i + 3] = alpha;
    }
  }
  return { width, height, data };
}

interface Lines {
  /** Nombre de lignes à flouter (les rangées, ou les colonnes). */
  lines: number;
  /** Nombre de pixels par ligne. */
  length: number;
  /** Écart dans le tableau entre le début de 2 lignes voisines. */
  lineStep: number;
  /** Écart dans le tableau entre 2 pixels voisins d'une même ligne. */
  pixelStep: number;
}

// Moyenne glissante : on garde la somme de la fenêtre et, d'un pixel au suivant, on ajoute celui qui entre
// et on retire celui qui sort. Le coût ne dépend donc pas du rayon. Au bord, le pixel du bord est répété.
function blurLines(source: Float32Array, { lines, length, lineStep, pixelStep }: Lines, radius: number): Float32Array {
  const result = new Float32Array(source.length);
  const windowSize = 2 * radius + 1;
  const indexOf = (line: number, position: number): number =>
    line * lineStep + Math.min(length - 1, Math.max(0, position)) * pixelStep;

  for (let line = 0; line < lines; line++) {
    for (let channel = 0; channel < 4; channel++) {
      let sum = 0;
      for (let position = -radius; position <= radius; position++) {
        sum += source[indexOf(line, position) + channel];
      }
      for (let position = 0; position < length; position++) {
        result[indexOf(line, position) + channel] = sum / windowSize;
        sum += source[indexOf(line, position + radius + 1) + channel] - source[indexOf(line, position - radius) + channel];
      }
    }
  }
  return result;
}
