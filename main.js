const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { machineId } = require('node-machine-id');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const VALID_LICENSE_CODES = require('./license-codes.json');

// Import new services
const SecureDatabase = require('./src/database/database');
const AuthService = require('./src/services/auth');
const SyncManager = require('./src/services/syncManager');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRHMDyDsQZ9NYBhEcN1RmLU5rf2oGeGJg",
  authDomain: "patispredict-76993.firebaseapp.com",
  projectId: "patispredict-76993",
  storageBucket: "patispredict-76993.firebasestorage.app",
  messagingSenderId: "729179366358",
  appId: "1:729179366358:web:b7cde4fffae51283cdba77",
  measurementId: "G-WDHP8L8JB8"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const firebaseAuth = getAuth(firebaseApp);

// Global services
let database = null;
let authService = null;
let syncManager = null;
let licenseStore = null;

async function initLicenseStore() {
  if (licenseStore) return licenseStore;

  const module = await import('electron-store');
  const Store = module.default || module;
  licenseStore = new Store({
    name: 'license',
    encryptionKey: 'coop-tafernout-secure-key-2025',
    clearInvalidConfig: true
  });

  return licenseStore;
}

// License verification functions
async function getMachineId() {
  try {
    return await machineId();
  } catch (error) {
    console.error('Failed to get machine ID:', error);
    return null;
  }
}

function isLicenseAllowed(licenseKey) {
  return VALID_LICENSE_CODES.includes(licenseKey);
}

function isLicenseValid() {
  const licenseData = licenseStore.get('activation');
  if (!licenseData) return false;

  const { licenseKey, machineId: storedMachineId, activatedAt } = licenseData;

  // Check if license key format is valid
  if (!licenseKey || !licenseKey.match(/^\d{6}$/)) {
    return false;
  }

  // Check if license key is in the authorized list
  if (!isLicenseAllowed(licenseKey)) {
    return false;
  }

  // Check if machine ID matches
  if (!storedMachineId) return false;

  // Check if activation is recent (within last year)
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (now - activatedAt > oneYear) return false;

  return true;
}

async function checkActivation() {
  if (!licenseStore) await initLicenseStore();

  if (!isLicenseValid()) return false;

  const currentMachineId = await getMachineId();
  const storedMachineId = licenseStore.get('activation.machineId');

  return currentMachineId === storedMachineId;
}

async function initFirebase() {
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously to Firebase');
  } catch (error) {
    console.error('Firebase auth error:', error);
  }
}

// Global variable to track activation status
let isActivated = false;
let mainWindow = null;
let activationWindow = null;
const { spawn } = require('child_process');

// Data file stored in user's app data folder (persists between sessions)
//
// Electron main process acting as backend storage for the desktop app.
// The frontend renderer page uses preload.js to call IPC handlers below.
const DATA_FILE = path.join(app.getPath('userData'), 'tafernout_data.json');
const REPORTS_DIR = path.join(app.getPath('userData'), 'reports');
const PYTHON_RUNTIME_DIR = path.join(app.getPath('userData'), 'python-runtime');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getReportOutputPath(scriptName) {
  ensureDir(REPORTS_DIR);

  if (scriptName === 'rapport_financier.py') {
    return path.join(REPORTS_DIR, 'rapport_financier.html');
  }

  if (scriptName === 'alertes_stock.py') {
    return path.join(REPORTS_DIR, 'alertes_stock.txt');
  }

  return path.join(REPORTS_DIR, `${path.parse(scriptName).name}.txt`);
}

function getRunnablePythonScript(scriptName) {
  const sourcePath = path.join(__dirname, 'python_tools', scriptName);
  if (!fs.existsSync(sourcePath)) return null;

  // Python cannot reliably execute files directly from app.asar.
  if (!sourcePath.includes('.asar')) return sourcePath;

  const runtimeDir = path.join(PYTHON_RUNTIME_DIR, 'python_tools');
  const runtimePath = path.join(runtimeDir, scriptName);
  ensureDir(runtimeDir);
  fs.copyFileSync(sourcePath, runtimePath);
  return runtimePath;
}

function runPythonProcess(scriptPath, env) {
  const attempts = process.platform === 'win32'
    ? [
        { command: 'py', args: ['-3', scriptPath] },
        { command: 'python', args: [scriptPath] },
      ]
    : [
        { command: 'python3', args: [scriptPath] },
        { command: 'python', args: [scriptPath] },
      ];

  return new Promise((resolve) => {
    const tryRun = (index) => {
      if (index >= attempts.length) {
        resolve({
          success: false,
          error: 'Python est introuvable. Installez Python 3 ou ajoutez-le au PATH.'
        });
        return;
      }

      const attempt = attempts[index];
      const pythonProcess = spawn(attempt.command, attempt.args, {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      let output = '';
      let errorOutput = '';
      let settled = false;

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (settled) return;
        settled = true;

        if (code === 0) {
          resolve({ success: true, output });
          return;
        }

        resolve({
          success: false,
          error: (errorOutput || output || `Script termine avec code ${code}`).trim()
        });
      });

      pythonProcess.on('error', (error) => {
        if (settled) return;
        settled = true;

        if (error.code === 'ENOENT') {
          tryRun(index + 1);
          return;
        }

        resolve({ success: false, error: error.message });
      });
    };

    tryRun(0);
  });
}

// â”€â”€ Window â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function createMainWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  const iconExists = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Coop Tafernout ERP - ActivÃ©',
    ...(iconExists ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // allow loading local vendor JS files
      ...(process.env.NODE_ENV === 'production' && {
        devTools: false // Disable DevTools in production
      })
    },
    backgroundColor: '#FBF6F1',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Show window once content is ready
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Remove default menu bar
  mainWindow.setMenuBarVisibility(false);

  // Disable DevTools shortcuts in production
  if (process.env.NODE_ENV === 'production') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
      if (input.key === 'F12') {
        event.preventDefault();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createActivationWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  const iconExists = fs.existsSync(iconPath);

  activationWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    title: 'Activation - Coop Tafernout ERP',
    ...(iconExists ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      ...(process.env.NODE_ENV === 'production' && {
        devTools: false
      })
    },
    backgroundColor: '#FBF6F1',
    show: false,
  });

  activationWindow.loadFile(path.join(__dirname, 'src', 'activation.html'));

  activationWindow.once('ready-to-show', () => activationWindow.show());

  activationWindow.setMenuBarVisibility(false);

  activationWindow.on('closed', () => {
    activationWindow = null;
  });

  return activationWindow;
}

function createLoginWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  const iconExists = fs.existsSync(iconPath);

  loginWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    title: 'Login - Coop Tafernout ERP',
    ...(iconExists ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    backgroundColor: '#FBF6F1',
    show: false,
  });

  loginWindow.loadFile(path.join(__dirname, 'src', 'login.html'));

  loginWindow.once('ready-to-show', () => loginWindow.show());

  loginWindow.setMenuBarVisibility(false);

  loginWindow.on('closed', () => {
    loginWindow = null;
  });

  return loginWindow;
}

// â”€â”€ IPC: Read data from secure database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('data:load', async () => {
  try {
    if (!database) return { ok: false, error: 'Database not initialized' };

    const data = database.getAllData();
    return { ok: true, data };
  } catch (err) {
    console.error('data:load error', err);
    return { ok: false, error: err.message };
  }
});

// â”€â”€ IPC: Save data to secure database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('data:save', async (_event, payload) => {
  try {
    if (!database) return { ok: false, error: 'Database not initialized' };

    // Save to local database
    for (const [key, value] of Object.entries(payload)) {
      database.setData(key, value);
    }

    // Queue for sync if online
    if (syncManager) {
      syncManager.addToQueue('data_save', payload);
    }

    return { ok: true };
  } catch (err) {
    console.error('data:save error', err);
    return { ok: false, error: err.message };
  }
});

// â”€â”€ IPC: Run Python script â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('run-python', async (_event, scriptName) => {
  const scriptPath = getRunnablePythonScript(scriptName);

  if (!scriptPath) {
    return { success: false, error: `Script non trouve: ${scriptName}` };
  }

  const outputFile = getReportOutputPath(scriptName);
  const result = await runPythonProcess(scriptPath, {
    ...process.env,
    TAFERNOUT_DATA_FILE: DATA_FILE,
    TAFERNOUT_OUTPUT_FILE: outputFile,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    output: result.output,
    outputFile,
  };
});
ipcMain.handle('open-file', async (_event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// â”€â”€ IPC: Activate license â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('activate-license', async (_event, licenseKey) => {
  try {
    if (!licenseStore) await initLicenseStore();
    const normalizedLicenseKey = String(licenseKey || '').replace(/\D/g, '');

    // Validate license key format
    if (!normalizedLicenseKey.match(/^\d{6}$/)) {
      return { success: false, error: 'Format de clÃ© invalide. Utilisez 6 chiffres (ex. 123456)' };
    }

    // Validate license key against the saved list
    if (!isLicenseAllowed(normalizedLicenseKey)) {
      return { success: false, error: 'ClÃ© de licence non autorisÃ©e. Veuillez utiliser une clÃ© fournie par le vendeur.' };
    }

    // Get current machine ID
    const machineId = await getMachineId();
    if (!machineId) {
      return { success: false, error: 'Impossible d\'identifier cette machine' };
    }

    // Store activation data
    licenseStore.set('activation', {
      licenseKey: normalizedLicenseKey,
      machineId,
      activatedAt: Date.now()
    });

    isActivated = true;

    if (activationWindow) {
      createMainWindow();
      activationWindow.close();
    }

    return { success: true };
  } catch (error) {
    console.error('Activation error:', error);
    return { success: false, error: 'Erreur lors de l\'activation' };
  }
});

// â”€â”€ IPC: Authentication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('auth:login', async (_event, credentials) => {
  try {
    if (!authService) return { success: false, error: 'Auth service not initialized' };

    const result = await authService.login(credentials.email, credentials.password);
    return { success: true, user: result.user, token: result.token };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:register', async (_event, credentials) => {
  try {
    if (!authService) return { success: false, error: 'Auth service not initialized' };

    const user = await authService.register(credentials.email, credentials.password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:logout', async () => {
  try {
    if (!authService) return { success: false, error: 'Auth service not initialized' };

    await authService.logout();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:check', async () => {
  try {
    if (!authService) return { authenticated: false };

    const authenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const token = authService.getSessionToken();

    return { authenticated, user, token };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
});

// â”€â”€ IPC: Sync operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ipcMain.handle('sync:status', async () => {
  try {
    if (!syncManager) return { isOnline: false, syncInProgress: false, queueLength: 0 };

    return syncManager.getSyncStatus();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('sync:force', async () => {
  try {
    if (!syncManager) return { success: false, error: 'Sync manager not initialized' };

    await syncManager.forceSync();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// â”€â”€ App lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.whenReady().then(async () => {
  // Initialize services
  database = new SecureDatabase();
  authService = new AuthService();
  syncManager = new SyncManager(database, authService);

  await initLicenseStore();
  await authService.initialize();

  // Check authentication and subscription
  const isAuthenticated = authService.isAuthenticated();
  const subscriptionValid = isAuthenticated ? await authService.verifySubscription(authService.getCurrentUser()?.uid) : false;

  if (isAuthenticated && subscriptionValid) {
    createMainWindow();
  } else {
    createLoginWindow(); // We'll need to create this
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    isActivated = await checkActivation();
    if (isActivated) {
      createMainWindow();
    } else {
      createActivationWindow();
    }
  }
});
