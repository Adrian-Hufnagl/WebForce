const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: 'assets/icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  win.webContents.openDevTools()
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)
