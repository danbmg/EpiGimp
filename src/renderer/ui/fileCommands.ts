import type { ImageFormat } from '../../shared/fileApi';
import { createDocument, replaceDocument, type Document } from '../core/document';
import type { History } from '../core/history';
import { decodeImage, encodeImage } from '../io/imageFile';
import type { CanvasView } from './canvasView';
import type { NewDocumentDialog } from './newDocumentDialog';

const UNTITLED = 'Untitled';

// Les commandes du menu File. Le disque passe toujours par `window.fileApi` (le preload), jamais directement.
export function initFileCommands(
  newDialog: NewDocumentDialog,
  doc: Document,
  history: History,
  view: CanvasView,
): Record<'new' | 'open' | 'export-png' | 'export-jpeg', () => void> {
  /** Nom proposé à l'export : celui du fichier ouvert, sans son extension. */
  let documentName = UNTITLED;

  // Le nouveau document prend la place de l'ancien, dans le même objet `doc`.
  const load = (next: Document, name: string): void => {
    replaceDocument(doc, next);
    documentName = name;
    history.clear(); // prévient aussi le panneau des calques et les boutons Undo / Redo
    view.fitDocument();
  };

  const exportAs = (format: ImageFormat): void =>
    run('Could not export the image', async () => {
      await window.fileApi.exportImage(await encodeImage(doc, format), format, documentName);
    });

  return {
    new: () =>
      run('Could not create the image', async () => {
        const size = await newDialog.ask(doc);
        if (size) {
          load(createDocument(size.width, size.height), UNTITLED);
        }
      }),
    open: () =>
      run('Could not open the image', async () => {
        const file = await window.fileApi.openImage();
        if (file) {
          load(await decodeImage(file.name, file.data), withoutExtension(file.name));
        }
      }),
    'export-png': () => exportAs('png'),
    'export-jpeg': () => exportAs('jpeg'),
  };
}

// Lance une commande ; si elle échoue (fichier qui n'est pas une image, image trop grande…), on prévient l'utilisateur.
function run(failure: string, task: () => Promise<void>): void {
  task().catch((error: unknown) => {
    window.alert(`${failure}: ${error instanceof Error ? error.message : String(error)}`);
  });
}

// « photo.jpg » → « photo ».
function withoutExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}
