const { app, BrowserWindow, session, Menu, ipcMain, globalShortcut, clipboard, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store');
const {SHORTCUT, EXTENSIONS, controlKey, readJS} = require('./utils');
const { registerExtensions } = require('./extensions');

// const { menubar } = require('electron-menubar');

const store = new Store();
const createMenu = require('./menu');
const conversationUrl = 'https://chat.openai.com/backend-api/conversation'

// const mb = menubar({
//   index: electron.remote.getCurrentWindow().webContents.getURL(), // 应用程序的主页面
//   icon: path.join(__dirname, 'chatMate.png') // 菜单栏图标
// });

// mb.on('ready', () => {
//   console.log('App is ready');
// });
let spotlightWin;
let chatGPTWin;
const devtools = {
  chatgpt: true,
  spotlight: false
}

function createSpotlightWindow() {
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
      nativeWindowOpen: true
    },
  });

  spotlightWin.loadFile(path.join(__dirname, 'spotlight.html'));
  if (devtools.spotlight) spotlightWin.webContents.openDevTools()

    // 添加 blur 事件监听器
  spotlightWin.on('blur', () => {
    spotlightWin.close();
  });
  
  spotlightWin.on('closed', () => {
    spotlightWin = null;
  });
}

function isSpotlightQuerying(headers) {
  return spotlightWin && headers['content-type'] && headers['content-type'].toString().includes('text/event-stream')
}

function createChatGPTWindow () {
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.78'
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // 创建浏览器窗口并加载指定网址
  chatGPTWin = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      clipboard: true
    },
  })
  const menu = createMenu(app, chatGPTWin)
  Menu.setApplicationMenu(menu)
  
  // 监听 chatGPT 的响应
  const ses = chatGPTWin.webContents.session;
  const conversationFilter = { urls: [conversationUrl] }
  ses.webRequest.onResponseStarted(conversationFilter, (details, callback) => {
    if (isSpotlightQuerying(details.responseHeaders)) {
      // extract the response from the chatGPT every 500ms
      chatGPTWin.webContents.executeJavaScript(`
        var interval = setInterval(() => { sendReponse() }, 500)
      `)
    }
  });

  ses.webRequest.onCompleted(conversationFilter, (details, callback) => {
    // extract the response from the chatGPT when the response is completed
    if (isSpotlightQuerying(details.responseHeaders)) {
      chatGPTWin.webContents.executeJavaScript(`
        if (interval) { clearInterval(interval) }
        sendReponse()
        // run again in case the response is not completed
        setTimeout(() => { sendReponse() }, 300)
      `)
    }
  })

  chatGPTWin.loadURL('https://chat.openai.com')
  chatGPTWin.webContents.on('did-finish-load', () => {
    // 在页面中注入脚本, 用于主线程和 chatGPT 窗口之间的通信
    chatGPTWin.webContents.executeJavaScript(readJS('chatgpt-injection.js'))
  })
  if (devtools.chatgpt) { chatGPTWin.webContents.openDevTools() }
}

function initializeShortcuts() {
  var globalKey;
  if (store.get(SHORTCUT.global)) {
    globalKey = store.get(SHORTCUT.global);
  } else {
    globalKey = controlKey('M'); // 默认快捷键
  }
  try {
    setGlobalShortcut(globalKey)
  } catch (err) {
    dialog.showErrorBox('Error', `Register global shortcut failed: ${err.message}. Will delete the shortcut automatically.`);
    store.delete(SHORTCUT.global);
  }
}

function setGlobalShortcut(globalKey) {
  console.log('change globalKey: ' + globalKey)
  // deal with the possible error
  globalShortcut.register(globalKey, () => {
    if (!spotlightWin) {
      createSpotlightWindow();
    } else {
      spotlightWin.close();
    }
  })
  store.set(SHORTCUT.global, globalKey);
}
// 当应用程序准备就绪时创建窗口
app.whenReady().then(async () => {
  await registerExtensions(session, store.get(EXTENSIONS, []));

  initializeShortcuts();

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
  ipcMain.on('set-response', (event, reponse) => {
    if (spotlightWin) {
      spotlightWin.webContents.send('set-spotlight-response', reponse)
    }
  })

  ipcMain.on('shortcut-register-global', (event, key) => {
    if (store.get(SHORTCUT.global)) {
      const key = store.get(SHORTCUT.global);
      if (globalShortcut.isRegistered(key)) {
        globalShortcut.unregister(key)
      }
    }
    store.set(SHORTCUT.global, key);
  });

  ipcMain.on('save-settings', (event, settings) => {
    // 保存设置到本地存储
    store.set('settings', settings);
  })

  createChatGPTWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createChatGPTWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregister('CmdOrCtrl+Space');
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit()
})

// if (process.platform === 'darwin') {
//   app.on('will-finish-launching', () => {
//     // 加载 Info.plist 文件
//     const plistPath = path.join(__dirname, 'Info.plist');
//     app.setAboutPanelOptions({ applicationName: app.name, version: app.getVersion() });
//     app.setActivationPolicy('regular');
//     app.dock.hide();
//     app.setAboutPanelOptions({ applicationName: app.name, version: app.getVersion() });
//     // app.dock.setIcon(path.join(__dirname, '..', 'icon.icns'));
//   });
// }
