import path from 'node:path';
import type { ImageFormat } from '../shared/fileApi';

/** Extensions acceptées pour chaque format ; la première est celle ajoutée si le nom n'en a pas. */
export const EXTENSIONS: Record<ImageFormat, readonly string[]> = {
  png: ['png'],
  jpeg: ['jpg', 'jpeg'],
};

// Ajoute l'extension du format si le nom tapé n'en a pas la bonne : « dessin » → « dessin.png ».
export function withExtension(filePath: string, format: ImageFormat): string {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return EXTENSIONS[format].includes(extension) ? filePath : `${filePath}.${EXTENSIONS[format][0]}`;
}
