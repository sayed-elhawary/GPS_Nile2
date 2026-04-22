// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: "NileMix - Equipment SIM Management",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  // افتح DevTools دائمًا (مهم جداً للتصحيح)
  mainWindow.webContents.openDevTools();

  if (isDev) {
    console.log('🚀 Development mode → Loading http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production mode
    const indexPath = path.join(__dirname, '../frontend/build/index.html');
   
    console.log('📂 Trying to load index.html from:', indexPath);
    console.log('📁 Does index.html exist?', fs.existsSync(indexPath));

    mainWindow.loadFile(indexPath)
      .then(() => {
        console.log('✅ index.html loaded successfully');
      })
      .catch((err) => {
        console.error('❌ Failed to load index.html');
        console.error('Error message:', err.message);
        console.error('Full error:', err);
      });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ did-fail-load:', errorDescription);
    console.error('URL:', validatedURL);
  });
}

// ====================== Backend ======================
function startBackend() {
  let backendPath;
  let cwd;

  if (isDev) {
    // ==================== Development Mode ====================
    backendPath = path.join(__dirname, '../backend/index.js');
    cwd = path.join(__dirname, '../backend');
    console.log('🛠️ Dev Backend Path:', backendPath);
  } else {
    // ==================== Production Mode (.exe) ====================
    const resourcesPath = process.resourcesPath || path.join(app.getAppPath(), '..');

    backendPath = path.join(resourcesPath, 'backend', 'index.js');
    cwd = path.join(resourcesPath, 'backend');

    console.log('📦 === PRODUCTION MODE ===');
    console.log('App Path:', app.getAppPath());
    console.log('Resources Path:', process.resourcesPath);
    console.log('Backend Path:', backendPath);
    console.log('Backend Folder Exists?', fs.existsSync(cwd));
    console.log('index.js Exists?', fs.existsSync(backendPath));
  }

  // فحص أمان قبل التشغيل
  if (!fs.existsSync(backendPath)) {
    console.error('❌ CRITICAL ERROR: Backend file not found!');
    console.error('Expected path:', backendPath);
    return;
  }

  console.log(`🚀 Starting backend from: ${backendPath}`);

  backendProcess = spawn('node', [backendPath], {
    cwd: cwd,
    env: {
      ...process.env,
      PORT: 5000,
      NODE_ENV: 'production'
    },
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend Error]', data.toString().trim());
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Backend Spawn Error:', err.message);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend exited with code ${code} signal ${signal}`);
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('🛑 Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// ====================== App Events ======================
app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('quit', () => {
  stopBackend();
});