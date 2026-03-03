const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, allowServiceWorkers: true } }
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "README Architect",
    backgroundColor: '#0d1117',
    icon: path.join(__dirname, 'assets/window-icon.png')
  });

  mainWindow.setMenu(null);
  mainWindow.removeMenu();

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  handleFileOpen(process.argv);
}

const handleFileOpen = (argv) => {
  if (!mainWindow) return;
  const filePath = argv.find(arg => arg.endsWith('.md') || arg.endsWith('.txt'));
  if (filePath && fs.existsSync(filePath)) {
    const absolutePath = path.resolve(filePath);
    console.log('Opening file:', absolutePath);
    const sendFile = () => {
      try {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        mainWindow.webContents.send('open-file', {
          content,
          path: absolutePath,
          name: path.basename(absolutePath)
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    };

    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', sendFile);
    } else {
      sendFile();
    }
  }
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      handleFileOpen(commandLine);
    }
  });

  app.whenReady().then(() => {
    // Modern protocol handling for Electron 25+
    protocol.handle('local-resource', (request) => {
      let urlPath = request.url.replace(/^local-resource:\/\/+/, '');
      urlPath = decodeURIComponent(urlPath);

      // Normalize path for Windows
      if (process.platform === 'win32' && urlPath.startsWith('/') && urlPath.includes(':')) {
        urlPath = urlPath.substring(1);
      }

      try {
        const absolutePath = path.resolve(urlPath);
        return net.fetch(pathToFileURL(absolutePath).href);
      } catch (err) {
        console.error('Protocol error:', err);
      }
    });

    createWindow();
  });
}

ipcMain.handle('save-file', async (event, { path: filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Error saving file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-snap', async (event, { name, content }) => {
  const filePath = path.join(__dirname, 'snaps.json');
  let snaps = [];

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      snaps = JSON.parse(data);
    } catch (e) {
      console.error('Error reading snaps.json', e);
    }
  }

  snaps.push({
    id: Date.now(),
    name: name || `Snap ${new Date().toLocaleTimeString()}`,
    content: content,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(filePath, JSON.stringify(snaps, null, 2));
  return { success: true };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
