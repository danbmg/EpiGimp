import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Sous Windows, l'installeur Squirrel relance l'app pendant l'install/désinstall : on quitte direct.
if (started) {
  app.quit();
}

// Crée la fenêtre principale et charge la page du renderer.
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: 'EpiGimp',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Redonne les raccourcis DevTools en dev, puisque le menu natif est supprimé.
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      const isF12 = input.key === 'F12';
      const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i';
      if (input.type === 'keyDown' && (isF12 || isCtrlShiftI)) {
        mainWindow.webContents.toggleDevTools();
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.on('ready', () => {
  // Le menu de l'éditeur est dessiné en HTML : on retire le menu natif d'Electron.
  Menu.setApplicationMenu(null);
  createWindow();
});

// Quitte quand toutes les fenêtres sont fermées, hors macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS : recrée une fenêtre si on clique sur l'icône du dock sans fenêtre ouverte.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
