
const { Menu, BrowserWindow } = require('electron');
const path = require('path');
const { controlKey } = require('./utils');

function createMenu(app, window) {
  return Menu.buildFromTemplate([
    {
      label: "edit",
      submenu: [
        {
          role: 'Reload',
          accelerator: controlKey('R'),
          click: () => {
            window.webContents.reload();
          }
        },
        {
          role: 'Copy',
          accelerator: controlKey('C'),
          click: () => {
            window.webContents.copy();
          }
        },
        {
          role: 'Cut',
          accelerator: controlKey('X'),
          click: () => {
            window.webContents.paste();
          }
        },
        {
          role: 'Paste',
          accelerator: controlKey('V'),
          click: () => {
            window.webContents.paste();
          }
        },
        {
          role: 'SelectAll',
          accelerator: controlKey('A'),
          click: () => {
            window.webContents.selectAll();
          }
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Configure Settings',
          click: () => {
            // 创建新窗口以显示设置页面
            let settingsWindow = new BrowserWindow({
              width: 1000,
              height: 800,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                nativeWindowOpen: true
              }
            });
            settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
            settingsWindow.on('closed', () => {
              settingsWindow = null;
            });
            // settingsWindow.webContents.openDevTools();
          }
        }
      ]
    }
  ])
}

module.exports = createMenu;
