const { app, BrowserWindow, shell, protocol } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let server;

// Create a simple HTTP server to serve the app
function startServer() {
  server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    const extname = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.ico': 'image/x-icon'
    };
    
    const contentType = contentTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if(error.code == 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
  
  server.listen(5501, () => {
    console.log('Electron server running on http://localhost:5501');
  });
}

function createWindow(){
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      sandbox: false, // Allow OAuth popups
      nodeIntegration: false
    }
  });

  win.removeMenu();
  
  // Always load from localhost server for OAuth compatibility
  win.loadURL('http://localhost:5501/index.html')

  // Handle OAuth popups - allow Google domains
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Google OAuth popups to open in new window
    if (url.includes('accounts.google.com') || url.includes('googleapis.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          webPreferences: {
            sandbox: false
          }
        }
      };
    }
    // Open other external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if(process.platform !== 'darwin') app.quit();
});
