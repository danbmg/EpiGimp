import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// On Windows, the Squirrel installer launches the app while installing/uninstalling: quit right away.
if (started) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    // Below this size the side panels would squeeze the canvas area too much.
    minWidth: 800,
    minHeight: 500,
    title: 'EpiGimp',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // The renderer has no Node access: it only reaches the main process through the preload API.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev: page served by the Vite dev server (hot reload). Packaged app: built HTML file.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // The native menu is removed (see below), so give DevTools its usual shortcuts back in development.
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
  // The editor draws its own menu bar in HTML: remove Electron's default native menu.
  Menu.setApplicationMenu(null);
  createWindow();
});

// Quit when all windows are closed, except on macOS where apps usually stay active.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS: re-create a window when the dock icon is clicked and none is open.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
