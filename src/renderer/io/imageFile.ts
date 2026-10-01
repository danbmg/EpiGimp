import type { ImageFormat } from '../../shared/fileApi';
import { createDocument, type Document } from '../core/document';
import { getLayerContext } from '../core/layer';
import { drawLayers } from '../render/compositor';

/** Qualité des JPG, de 0 à 1 : la valeur par défaut des navigateurs, bon compromis entre taille et netteté. */
export const JPEG_QUALITY = 0.92;
/** Le JPG ne gère pas la transparence : les zones transparentes sont exportées sur ce fond. */
export const JPEG_BACKGROUND = '#ffffff';

// Décode un PNG ou un JPG en un nouveau document d'un seul calque, nommé comme le fichier.
// Échoue si le fichier n'est pas une image, ou si elle dépasse la taille maximale.
export async function decodeImage(name: string, data: Uint8Array<ArrayBuffer>): Promise<Document> {
  const bitmap = await createImageBitmap(new Blob([data]));
  try {
    const doc = createDocument(bitmap.width, bitmap.height);
    doc.activeLayer.name = name;
    getLayerContext(doc.activeLayer).drawImage(bitmap, 0, 0);
    return doc;
  } finally {
    bitmap.close(); // libère l'image décodée tout de suite, sans attendre le ramasse-miettes
  }
}

// Aplatit les calques visibles, exactement comme à l'écran (`drawLayers`), puis encode l'image.
export async function encodeImage(doc: Document, format: ImageFormat): Promise<Uint8Array<ArrayBuffer>> {
  const canvas = new OffscreenCanvas(doc.width, doc.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context is not available for the export');
  }
  if (format === 'jpeg') {
    ctx.fillStyle = JPEG_BACKGROUND;
    ctx.fillRect(0, 0, doc.width, doc.height);
  }
  drawLayers(ctx, doc);
  const blob = await canvas.convertToBlob({ type: `image/${format}`, quality: JPEG_QUALITY });
  return new Uint8Array(await blob.arrayBuffer());
}
