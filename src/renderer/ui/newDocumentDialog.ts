import { MAX_DOCUMENT_SIZE } from '../core/document';

export interface DocumentSize {
  width: number;
  height: number;
}

// Boîte « New image » (`<dialog>` de index.html) : demande la largeur et la hauteur.
export interface NewDocumentDialog {
  /** Ouvre la boîte avec `current` déjà rempli ; donne la taille choisie, ou null si l'utilisateur annule. */
  ask(current: DocumentSize): Promise<DocumentSize | null>;
}

export function initNewDocumentDialog(dialog: HTMLElement): NewDocumentDialog {
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error('#new-dialog must be a <dialog> in index.html');
  }
  const width = query<HTMLInputElement>(dialog, '#new-width');
  const height = query<HTMLInputElement>(dialog, '#new-height');
  // Le navigateur refuse lui-même de valider hors des bornes (min, max, step et required dans index.html).
  width.max = String(MAX_DOCUMENT_SIZE);
  height.max = String(MAX_DOCUMENT_SIZE);
  // Cancel n'est pas un bouton d'envoi : Entrée dans un champ valide donc avec Create.
  query<HTMLButtonElement>(dialog, '#new-cancel').addEventListener('click', () => dialog.close());

  return {
    ask(current) {
      width.valueAsNumber = current.width;
      height.valueAsNumber = current.height;
      dialog.returnValue = '';
      dialog.showModal();
      // Create ferme la boîte avec la valeur « create » ; Cancel et Échap la ferment sans valeur.
      return new Promise((resolve) => {
        dialog.addEventListener(
          'close',
          () => resolve(dialog.returnValue === 'create' ? { width: width.valueAsNumber, height: height.valueAsNumber } : null),
          { once: true },
        );
      });
    },
  };
}

// Récupère un élément de la boîte, ou échoue au démarrage s'il manque dans index.html.
function query<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing from index.html`);
  }
  return element;
}
