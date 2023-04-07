const { app, BrowserWindow, session, Menu, ipcMain, globalShortcut, Tray, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store');
const {SHORTCUT, EXTENSIONS, controlKey, readJS} = require('./utils');
const { registerExtensions } = require('./extensions');
const { startHttpServer, isHttpQuerying } = require('./httpServer');

const store = new Store();
const createMenu = require('./menu');
const chatGPTUrl=  "https://chat.openai.com/";
const conversationUrl = 'https://chat.openai.com/backend-api/conversation'

function absolutePath(file) {
  return path.join(__dirname, file);
}

let spotlightWin;
let chatGPTWin;
let trayGPTWin;
let appIcon;
const devtools = {
  chatgpt: false,
  spotlight: false,
  tray: false,
}
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.78'

function createSpotlightWindow() {
  if (spotlightWin) { 
    return spotlightWin;
  }
  spotlightWin = new BrowserWindow({
    width: 600,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      clipboard: true,
    },
  });

  spotlightWin.loadFile(absolutePath('spotlight.html'));
  if (devtools.spotlight) spotlightWin.webContents.openDevTools()
  spotlightWin.on('closed', () => { spotlightWin = null })
  toggleWindowEvent(spotlightWin);
  return spotlightWin;
}

function isSpotlightOrHttpQuerying(headers) {
  const http = isHttpQuerying()
  console.log("isSpotlightOrHttpQuerying: " + http + ", " + (spotlightWin && spotlightWin.isVisible()))
  return ((spotlightWin && spotlightWin.isVisible()) || isHttpQuerying()) && headers['content-type'] && headers['content-type'].toString().includes('text/event-stream')
}

function createChatGPTWindow () {
  // 创建浏览器窗口并加载指定网址
  chatGPTWin = new BrowserWindow({
    width: 1000,
    height: 800,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      preload: absolutePath('preload.js'),
      clipboard: true
    },
  })
  const menu = createMenu(app, chatGPTWin)
  Menu.setApplicationMenu(menu)
  
  // 监听 chatGPT 的响应
  const ses = chatGPTWin.webContents.session;
  const conversationFilter = { urls: [conversationUrl] }
  ses.webRequest.onResponseStarted(conversationFilter, (details, callback) => {
    if (isSpotlightOrHttpQuerying(details.responseHeaders)) {
      // extract the response from the chatGPT every 500ms
      chatGPTWin.webContents.executeJavaScript(`
        var interval = setInterval(() => { sendReponse(false) }, 500);
      `)
    }
  });

  ses.webRequest.onCompleted(conversationFilter, (details, callback) => {
    // extract the response from the chatGPT when the response is completed
    if (isSpotlightOrHttpQuerying(details.responseHeaders)) {
      chatGPTWin.webContents.executeJavaScript(`
        if (interval) { clearInterval(interval) }
        sendReponse(false)
        // run again in case the response is not completed
        setTimeout(() => { sendReponse(true) }, 300);
      `)
    }
  })

  chatGPTWin.loadURL(chatGPTUrl)
  chatGPTWin.webContents.on('did-finish-load', () => {
    // 在页面中注入脚本, 用于主线程和 chatGPT 窗口之间的通信
    chatGPTWin.webContents.executeJavaScript(readJS(absolutePath('chatgpt-injection.js')))
  })
  if (devtools.chatgpt) { chatGPTWin.webContents.openDevTools() }
}

function createTrayWindow() {
  if (trayGPTWin) {
    return trayGPTWin;
  }
  trayGPTWin = new BrowserWindow({
    width: 550,
    height: 700,
    frame: false, // Remove window frame
    resizable: false, // Disable window resizing
    skipTaskbar: true, // Remove the window from the taskbar
    alwaysOnTop: false, // Keep the window on top of other windows
    webPreferences: {
      nodeIntegration: false,
      preload: absolutePath('preload.js'),
      clipboard: true
    }
  })
  trayGPTWin.loadURL(chatGPTUrl);
  toggleWindowEvent(trayGPTWin);
  trayGPTWin.webContents.on('did-finish-load', () => {
    trayGPTWin.webContents.executeJavaScript(`
      // hide window if press ESC
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          window.electronAPI.hideWindow('tray');
        }
      })
    `)
  })
  if (devtools.tray) trayGPTWin.webContents.openDevTools()
  return trayGPTWin;
}

function toggleWindowEvent(window) {
  // Add event listeners to hide the window
  window.on('blur', () => {
    window.hide();
  });

  window.on('keydown', (event) => {
    if (event.key === 'Escape') {
      window.hide();
    }
  });
}

const windowShortcuts = [
  {
    cacheKey: SHORTCUT.global,
    windowCreator: createSpotlightWindow,
    defaultAccelerator: controlKey('M'),
    trigger: () => { createSpotlightWindow().show() }
  },
  {
    cacheKey: SHORTCUT.menu,
    windowCreator: createTrayWindow,
    defaultAccelerator: controlKey('W'),
    trigger: () => {if (appIcon) appIcon.emit('click')}
  }
]

function initializeShortcuts() {
  for (const shortcut of windowShortcuts) {
    const accelerator = store.get(shortcut.cacheKey, shortcut.defaultAccelerator);
    registerWindowShortcut(shortcut.cacheKey, accelerator)
  }
}

function registerWindowShortcut(cacheKey, accelerator) {
  const obj = windowShortcuts.find(s => s.cacheKey === cacheKey)
  if (obj) {
    try {
      console.log(`register for ${cacheKey}: ${accelerator}`)
      globalShortcut.register(accelerator, () => {
        try {
          obj.trigger();
        } catch (err) {
          dialog.showErrorBox('Error', `Create window failed: ${err.message}`);
        }
      })
      store.set(cacheKey, accelerator);
    } catch (err) {
      dialog.showErrorBox('Error', `Register global shortcut failed: ${err.message}. Will delete the shortcut automatically.`);
      store.delete(cacheKey);
    }
  }
}

// 当应用程序准备就绪时创建窗口
app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  await registerExtensions(session, store.get(EXTENSIONS, []));
  initializeShortcuts();

  // set tray icon and window
  appIcon = new Tray(absolutePath('resources/icon-24Template.png'));
  appIcon.setToolTip('ChatMate')
  appIcon.on('click', () => {
    trayWin = createTrayWindow();
    trayWin.hide();
    const position = appIcon.getBounds();
    trayGPTWin.setBounds({
      x: position.x,
      y: position.y - 20, // Put the window under the icon
      width: 550,
      height: 700,
    });
    if (trayWin.isVisible()) {
      trayWin.hide();
    } else {
      trayWin.show();
    }
  })

  // 监听来自 spotlight 的消息
  ipcMain.on('send-query', (event, query) => {
    chatGPTWin.webContents.send(
      'send-quick-query', 
      {
        query, 
        promptList: store.get(SHORTCUT.quickPromptList, []),
        matchConversation: store.get(SHORTCUT.matchConversation, SHORTCUT.defaultMatchConversation)
      }
    )
  });

  // 接收到 chatGPT 的响应
  ipcMain.on('set-response', (event, result) => {
    if (spotlightWin && spotlightWin.isVisible()) {
      spotlightWin.webContents.send('set-spotlight-response', result.response)
    }
  })

  ipcMain.on('shortcut-register', (event, value) => {
    const {accelerator, cacheKey} = value
    const previousShortcut = store.get(cacheKey)
    if (previousShortcut) {
      if (globalShortcut.isRegistered(previousShortcut)) {
        globalShortcut.unregister(previousShortcut)
      }
    }
    registerWindowShortcut(cacheKey, accelerator)
  });

  ipcMain.on('save-settings', (event, settings) => {
    // 保存设置到本地存储
    store.set('settings', settings);
  })

  ipcMain.on('hide-window', (event, key) => {
    if (key === 'spotlight' && spotlightWin) {
      spotlightWin.hide()
    } else if (key === 'tray' && trayGPTWin) {
      trayGPTWin.hide()
    }
  })

  createChatGPTWindow();
  startHttpServer(chatGPTWin);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createChatGPTWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregister('CmdOrCtrl+Space');
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit()
})
