const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const StoryCreatorBackend = require('./story-creator-backend');

let mainWindow;
let storyCreatorWindow;
const backend = new StoryCreatorBackend();

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'favicon.ico'),
        title: 'Interactive Story Game'
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    // Create menu with Story Creator option
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Story...',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => openStoryCreator()
                },
                {
                    label: 'Story Creator Studio',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => openStoryCreator()
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Story Creator Studio',
                    click: () => openStoryCreator()
                },
                {
                    label: 'Build Game...',
                    click: () => openBuildDialog()
                },
                { type: 'separator' },
                {
                    label: 'Reload Stories',
                    accelerator: 'F5',
                    click: () => mainWindow.reload()
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => showAboutDialog()
                },
                {
                    label: 'Development Guide',
                    click: () => openDevGuide()
                }
            ]
        }
    ]);
    
    Menu.setApplicationMenu(menu);
}

function openStoryCreator() {
    if (storyCreatorWindow) {
        storyCreatorWindow.focus();
        return;
    }

    storyCreatorWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        title: 'Story Creator Studio',
        icon: path.join(__dirname, 'favicon.ico')
    });

    storyCreatorWindow.loadFile('story-creator.html');

    storyCreatorWindow.on('closed', () => {
        storyCreatorWindow = null;
    });
}

function openBuildDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Build Game',
        message: 'Game Building',
        detail: 'Open the Story Creator Studio (Tools > Story Creator Studio) to build your game with custom settings.\n\nOr use the command line:\nnpm run build-win',
        buttons: ['Open Story Creator', 'Cancel']
    }).then(result => {
        if (result.response === 0) {
            openStoryCreator();
        }
    });
}

function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About Interactive Story Game',
        message: 'Interactive Story Creator Studio',
        detail: 'Create, edit, and build your own interactive stories!\n\nFeatures:\n• Visual story creator\n• Character & combat systems\n• Build standalone executables\n• Share stories with others\n\nVersion 1.0.0'
    });
}

function openDevGuide() {
    const { shell } = require('electron');
    shell.openPath(path.join(__dirname, 'DEVELOPMENT_GUIDE.md'));
}

// IPC handlers for Story Creator
ipcMain.handle('create-story', async (event, storyData) => {
    try {
        const result = await backend.createStory(storyData);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('build-game', async (event, buildConfig) => {
    try {
        const result = await backend.buildGameWithStories(buildConfig);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('list-stories', async () => {
    try {
        const fs = require('fs').promises;
        const storiesFile = path.join(__dirname, 'story-content', '_stories.json');
        const stories = JSON.parse(await fs.readFile(storiesFile, 'utf8'));
        return { success: true, stories };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
