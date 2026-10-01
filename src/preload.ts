// Pont entre la page et le disque : la page ne voit que ces 2 fonctions, jamais ipcRenderer ni fs.
import { contextBridge, ipcRenderer } from 'electron';
import type { FileApi } from './shared/fileApi';

const fileApi: FileApi = {
  openImage: () => ipcRenderer.invoke('file:open'),
  exportImage: (data, format, defaultName) => ipcRenderer.invoke('file:export', data, format, defaultName),
};

contextBridge.exposeInMainWorld('fileApi', fileApi);
