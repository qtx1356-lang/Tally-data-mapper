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
    const serverPath = app.isPackaged 
      ? path.join(process.resourcesPath, 'app', 'dist', 'server.cjs') 
      : path.join(__dirname, 'dist', 'server.cjs');
    
    // Check if the server file exists
    require('fs').accessSync(serverPath);

    // Fork the process to run the server
    serverProcess = spawn(process.execPath, [serverPath], { 
      env: { ...process.env, NODE_ENV: 'production', ELECTRON_RUN_AS_NODE: '1' } 
    });

    serverProcess.stdout.on('data', (data) => console.log(`[EXFIN Backend]: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`[EXFIN Backend Error]: ${data}`));
    
    try {
      await checkBackendReady('http://127.0.0.1:3000/api/health');
      createWindow();
    } catch (timeoutErr) {
      console.error(timeoutErr);
      dialog.showErrorBox("Startup Timeout", "The backend server took too long to start. Please try restarting the application.");
      app.quit();
    }
  } catch (error) {
    console.error("Could not launch backend server:", error);
    dialog.showErrorBox("Backend Missing", "The backend server could not be located. Error: " + error.message);
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
