const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';

// Ścieżki
const frontendPath = path.join(__dirname, '../frontend/public');
const iconPath = path.join(frontendPath, 'icon.png');
const logsPath = path.join(os.homedir(), '.minecraft-launcher', 'logs.log');

// Przechwytywanie logów konsoli
const originalConsoleLog = console.log;
console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
    fs.appendFileSync(logsPath, `${new Date().toISOString()} - ${message}\n`);
    originalConsoleLog.apply(console, args);
};

// Funkcja do tworzenia okna
function createWindow() {
    let win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true,
        },
        autoHideMenuBar: true,
    });

    // Usuń domyślne menu
    Menu.setApplicationMenu(null);

    // Ładuj frontend
    win.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(frontendPath, 'index.html')}`
    );

    // Otwórz DevTools automatycznie tylko w trybie dev
    if (isDev) {
        win.webContents.openDevTools();
    }

    // Obsługa zamknięcia okna
    win.on('closed', () => {
        win = null;
    });

    // Maksymalizacja po załadowaniu
    win.webContents.on('did-finish-load', () => {
        win.maximize();
    });

    return win;
}

// Inicjalizacja aplikacji
app.whenReady().then(() => {
    let mainWindow = createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow();
        }
    });

    // Debug mode
    ipcMain.on('toggle-debug', (event, enable) => {
        if (enable) {
            mainWindow.webContents.openDevTools();
        } else if (!isDev) {
            mainWindow.webContents.closeDevTools();
        }
    });
});

// Zamknij aplikację
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('get-user-data-path', () => {
    return path.join(os.homedir(), '.minecraft-launcher');
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const fullPath = path.join(os.homedir(), '.minecraft-launcher', filePath);
        return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
        console.error(`Błąd przy odczycie pliku ${filePath}:`, error);
        throw error;
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        const fullPath = path.join(os.homedir(), '.minecraft-launcher', filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
        return true;
    } catch (error) {
        console.error(`Błąd przy zapisie pliku ${filePath}:`, error);
        throw error;
    }
});

// Czyszczenie przy wyjściu
app.on('before-quit', () => {
    BrowserWindow.getAllWindows().forEach(win => win.destroy());
});