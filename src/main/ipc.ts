import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageFormat, OpenedFile } from '../shared/fileApi';
import { EXTENSIONS, withExtension } from './fileNames';

const FORMAT_NAMES: Record<ImageFormat, string> = { png: 'PNG image', jpeg: 'JPG image' };

// Seul code de l'app qui touche au disque. Le renderer ne choisit jamais de chemin :
// c'est l'utilisateur, dans la boîte de dialogue native.
export function registerFileHandlers(): void {
  ipcMain.handle('file:open', async (event): Promise<OpenedFile | null> => {
    const result = await dialog.showOpenDialog(windowOf(event), {
      title: 'Open image',
      filters: [{ name: 'Images (PNG, JPG)', extensions: [...EXTENSIONS.png, ...EXTENSIONS.jpeg] }],
      properties: ['openFile'],
    });
    const [filePath] = result.filePaths;
    if (result.canceled || !filePath) {
      return null;
    }
    return { name: path.basename(filePath), data: new Uint8Array(await readFile(filePath)) };
  });

  // Les arguments viennent de la page : on vérifie leur type avant d'écrire quoi que ce soit.
  ipcMain.handle('file:export', async (event, data: unknown, format: unknown, defaultName: unknown) => {
    if (!(data instanceof Uint8Array) || (format !== 'png' && format !== 'jpeg') || typeof defaultName !== 'string') {
      throw new TypeError('Invalid export request');
    }
    const result = await dialog.showSaveDialog(windowOf(event), {
      title: 'Export image',
      defaultPath: withExtension(defaultName, format),
      filters: [{ name: FORMAT_NAMES[format], extensions: [...EXTENSIONS[format]] }],
    });
    if (result.canceled || !result.filePath) {
      return false;
    }
    await writeFile(withExtension(result.filePath, format), data);
    return true;
  });
}

// La fenêtre qui a fait la demande : la boîte de dialogue s'ouvre par-dessus elle et la bloque.
function windowOf(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('The request does not come from a window');
  }
  return window;
}
