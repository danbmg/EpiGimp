// Contrat entre le preload et le renderer : la seule façon pour la page de lire ou d'écrire un fichier.
// Types seulement : ce fichier ne contient aucun code qui s'exécute.

export type ImageFormat = 'png' | 'jpeg';

export interface OpenedFile {
  /** Nom du fichier, sans le dossier (ex. « photo.jpg »). */
  name: string;
  data: Uint8Array<ArrayBuffer>;
}

export interface FileApi {
  /** Boîte « Ouvrir » limitée aux PNG / JPG, puis lecture du fichier ; null si l'utilisateur annule. */
  openImage(): Promise<OpenedFile | null>;
  /** Boîte « Enregistrer sous » puis écriture de `data` ; false si l'utilisateur annule. */
  exportImage(data: Uint8Array<ArrayBuffer>, format: ImageFormat, defaultName: string): Promise<boolean>;
}

// `window.fileApi` est ajouté par le preload (contextBridge).
declare global {
  interface Window {
    fileApi: FileApi;
  }
}
