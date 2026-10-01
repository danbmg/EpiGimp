import type { Document } from './document';
import { getLayerContext, type Layer } from './layer';

/** Nombre d'actions qu'on peut annuler à la suite. */
export const HISTORY_LIMIT = 20;

// Un état sauvegardé qu'on sait remettre en place.
// restore() renvoie l'état qu'il vient d'écraser : c'est lui qui part dans l'autre pile.
export interface Snapshot {
  restore(): Snapshot;
}

// Annuler / rétablir avec deux piles d'états ; ce nom masque le History du DOM dans les fichiers qui l'importent.
export class History {
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  // À appeler juste avant une action, avec l'état qu'elle va modifier.
  // Après une nouvelle action, ce qui avait été annulé ne peut plus être rétabli.
  record(before: Snapshot): void {
    this.undoStack.push(before);
    if (this.undoStack.length > HISTORY_LIMIT) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  // Remet l'état d'avant la dernière action ; renvoie false s'il n'y a rien à annuler.
  undo(): boolean {
    const snapshot = this.undoStack.pop();
    if (!snapshot) {
      return false;
    }
    this.redoStack.push(snapshot.restore());
    return true;
  }

  // Refait la dernière action annulée ; renvoie false s'il n'y a rien à rétablir.
  redo(): boolean {
    const snapshot = this.redoStack.pop();
    if (!snapshot) {
      return false;
    }
    this.undoStack.push(snapshot.restore());
    return true;
  }
}

// Sauvegarde tous les pixels d'un calque : avant un coup de pinceau, de gomme ou un filtre (#11).
export function snapshotLayerPixels(layer: Layer): Snapshot {
  const ctx = getLayerContext(layer);
  const pixels = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
  return {
    restore() {
      const current = snapshotLayerPixels(layer);
      // Remplace les pixels sans mélange : un pixel transparent dans la sauvegarde redevient transparent.
      ctx.putImageData(pixels, 0, 0);
      return current;
    },
  };
}

// Sauvegarde la liste et l'ordre des calques : avant un ajout, une suppression ou un déplacement (#9).
// Les calques ne sont pas copiés : un calque supprimé reste dans la sauvegarde, avec ses pixels.
export function snapshotLayerList(doc: Document): Snapshot {
  const layers = [...doc.layers];
  return {
    restore() {
      const current = snapshotLayerList(doc);
      doc.layers = [...layers];
      return current;
    },
  };
}
