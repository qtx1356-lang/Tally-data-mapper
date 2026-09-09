const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

function checkBackendReady(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const poll = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error("Backend startup timed out after " + timeoutMs + "ms"));
        return;
      }

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(poll, 500);
        }
      }).on('error', () => {
        setTimeout(poll, 500);
      });
    };

    poll();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: "EXFIN Tally Data Mapper",
    autoHideMenuBar: true
  });

  mainWindow.loadURL('http://localhost:3000').catch(err => {
    console.error("Failed to load localhost:3000", err);
    dialog.showErrorBox("Connection Error", "Failed to connect to the internal EXFIN server.");
  });
}

app.whenReady().then(async () => {
  try {
    // With asar: false, the structure is release/win-unpacked/resources/app/dist/server.cjs
    const serverPath = app.isPackaged 
      ? path.join(process.resourcesPath, 'app', 'dist', 'server.cjs') 
      : path.join(__dirname, 'dist', 'server.cjs');
    
    console.log(`[EXFIN] Attempting to launch backend at: ${serverPath}`);

    // Verify file existence
    if (!require('fs').existsSync(serverPath)) {
      throw new Error(`Backend binary not found at ${serverPath}`);
    }

    // Fork the process
    serverProcess = spawn(process.execPath, [serverPath], { 
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        ELECTRON_RUN_AS_NODE: '1' 
      } 
    });

    serverProcess.stdout.on('data', (data) => console.log(`[EXFIN Backend]: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`[EXFIN Backend Error]: ${data}`));
    
    // Readiness check
    try {
      console.log("[EXFIN] Waiting for backend readiness...");
      await checkBackendReady('http://127.0.0.1:3000/api/health', 20000);
      console.log("[EXFIN] Backend ready, creating window.");
      createWindow();
    } catch (timeoutErr) {
      console.error("[EXFIN] Backend failed to start:", timeoutErr);
      dialog.showErrorBox(
        "Application Startup Failed", 
        "The EXFIN data engine failed to initialize within the expected time.\n\nPlease check if port 3000 is being blocked by another application."
      );
      app.quit();
    }
  } catch (error) {
    console.error("[EXFIN] Critical launch error:", error);
    dialog.showErrorBox(
      "Backend Initialization Error", 
      `An error occurred while starting the application core: ${error.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
