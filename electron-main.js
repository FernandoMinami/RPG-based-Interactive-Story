const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Allow loading local files
    },
    icon: path.join(__dirname, 'favicon.ico'),
    title: 'Interactive Story Game'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Remove menu bar (optional - remove this line if you want to keep the menu)
  Menu.setApplicationMenu(null);

  // Open DevTools in development (comment out for production)
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
