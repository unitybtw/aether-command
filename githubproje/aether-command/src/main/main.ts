import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, systemPreferences } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const checkPermissions = async () => {
  // 1. Check Camera
  if (process.platform === 'darwin') {
    const cameraStatus = systemPreferences.getMediaAccessStatus('camera');
    console.log(`[Main] Camera status: ${cameraStatus}`);
    if (cameraStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('camera');
    }
  }

  // 2. Check Accessibility (Required for AppleScript system control)
  const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (!isTrusted) {
    console.log('[Main] Accessibility permissions missing.');
    // This opens the System Settings to the Accessibility page
    // Note: Electron doesn't have a direct "ask" for accessibility, we can only check or inform the user.
    // The second parameter 'true' would attempt to prompt if not trusted, but macOS behavior varies.
    systemPreferences.isTrustedAccessibilityClient(true);
  }
};

const createTray = () => {
  // We'll use a simple nativeImage for the menu bar icon
  const iconPath = path.join(__dirname, '..', '..', 'src', 'assets', 'iconTemplate.png'); 
  try {
    tray = new Tray(iconPath);
  } catch(e) {
    tray = new Tray(nativeImage.createEmpty());
    tray.setTitle('Aether');
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Aether-Command Active', enabled: false },
    { type: 'separator' },
    { label: 'Show Dashboard', click: () => {
        mainWindow?.show();
    }},
    { label: 'Hide Dashboard', click: () => {
        mainWindow?.hide();
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
        app.quit();
    }}
  ]);
  tray.setToolTip('Aether-Command Gesture Controller');
  tray.setContextMenu(contextMenu);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'index.html'));
};

app.whenReady().then(async () => {
  app.dock.hide();
  
  await checkPermissions();
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC listeners for MAC Commands
ipcMain.on('gesture-action', (event, action: string) => {
    console.log(`[Main] Received Gesture Action: ${action}`);
    
    // Execute AppleScript or Shell Commands based on gesture
    switch(action) {
        case 'PLAY_PAUSE':
            exec(`osascript -e 'tell application "Spotify" to playpause'`, (err) => {
                if (err) exec(`osascript -e 'tell application "Music" to playpause'`);
            });
            break;
        case 'SWIPE_LEFT':
            // Simulating Ctrl+Left (Switch Space)
            exec(`osascript -e 'tell application "System Events" to key code 123 using control down'`);
            break;
        case 'SWIPE_RIGHT':
            // Simulating Ctrl+Right
            exec(`osascript -e 'tell application "System Events" to key code 124 using control down'`);
            break;
        case 'MUTE_TOGGLE':
            exec(`osascript -e 'set volume output muted not (output muted of (get volume settings))'`);
            break;
        case 'MISSION_CONTROL':
            // Simulating F3 (Mission Control)
            exec(`osascript -e 'tell application "System Events" to key code 160'`);
            break;
        case 'BRIGHTNESS_UP':
            exec(`osascript -e 'tell application "System Events" to key code 144'`);
            break;
        case 'BRIGHTNESS_DOWN':
            exec(`osascript -e 'tell application "System Events" to key code 145'`);
            break;
        case 'LOCK_SCREEN':
            // Lock screen command for macOS
            exec(`osascript -e 'tell application "System Events" to keystroke "q" using {control down, command down}'`);
            break;
        case 'MIC_MUTE':
            exec(`osascript -e 'set volume input volume (if input volume is 0 then 100 else 0)'`);
            break;
        case 'LAUNCH_SAFARI':
            exec(`open -a "Safari"`);
            break;
        case 'LAUNCH_SPOTIFY':
            exec(`open -a "Spotify"`);
            break;
    }
});

ipcMain.on('set-login-item', (event, openAtLogin: boolean) => {
    app.setLoginItemSettings({
        openAtLogin: openAtLogin,
        openAsHidden: true // Keep it silent in the background
    });
    console.log(`[Main] Auto-Launch set to: ${openAtLogin}`);
});

ipcMain.handle('get-login-item', () => {
    return app.getLoginItemSettings().openAtLogin;
});
