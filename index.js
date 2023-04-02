const { app, BrowserWindow, session, Menu, ipcMain, globalShortcut, clipboard } = require('electron')
const path = require('path')
const Store = require('electron-store');
const {SHORTCUT, controlKey} = require('./utils');

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
      clipboard: true
    },
  });

  spotlightWin.loadFile(path.join(__dirname, 'spotlight.html'));
  // spotlightWin.webContents.openDevTools()

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

function createWindow () {
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
        var interval = setInterval(() => {
          x = document.querySelectorAll('.markdown')
          response = x[x.length-1].innerHTML
          window.electronAPI.setResponse(response)
        }, 500)
      `)
    }
  });

  ses.webRequest.onCompleted(conversationFilter, (details, callback) => {
    // extract the response from the chatGPT when the response is completed
    if (isSpotlightQuerying(details.responseHeaders)) {
      chatGPTWin.webContents.executeJavaScript(`
        if (interval) clearInterval(interval)
        x = document.querySelectorAll('.markdown')
        response = x[x.length-1].innerHTML
        window.electronAPI.setResponse(response)
      `)
    }
  })

  chatGPTWin.loadURL('https://chat.openai.com')
  chatGPTWin.webContents.on('did-finish-load', () => {
    // 在页面中注入脚本, 用于向 chatGPT 发送消息
    chatGPTWin.webContents.executeJavaScript(`
      function sendMsg(msg) {
        const textarea = document.querySelector('textarea');
        textarea.value = msg;
        const enterKeyEvent = new KeyboardEvent('keydown', {
          code: 'Enter',
          key: 'Enter',
          charCode: 13,
          keyCode: 13,
          which: 13
        })
      
        // 在 textarea 上触发键盘事件
        textarea.dispatchEvent(enterKeyEvent)
        textarea.focus()
        textarea.nextElementSibling.click()
      }
      window.electronAPI.sendQuery((event, value) => {
        console.log('recieve value: ' + value)
        sendMsg(value)
      })
    `)
  })
  // chatGPTWin.webContents.openDevTools()
}

function initializeShortcuts() {
  var globalKey;
  if (store.get(SHORTCUT.global)) {
    globalKey = store.get(SHORTCUT.global);
  } else {
    globalKey = controlKey('M'); // 默认快捷键
    store.set(SHORTCUT.global, globalKey);
  }
  setGlobalShortcut(globalKey)
}

function setGlobalShortcut(globalKey) {
  console.log('change globalKey: ' + globalKey)
  globalShortcut.register(globalKey, () => {
    if (!spotlightWin) {
      createSpotlightWindow();
    } else {
      spotlightWin.close();
    }
  });
}
// 当应用程序准备就绪时创建窗口
app.whenReady().then(() => {
  initializeShortcuts();

  // 监听来自 spotlight 的消息
  ipcMain.on('send-query', (event, query) => {
    chatGPTWin.webContents.send('send-query', query)
  });

  // 接收到 chatGPT 的响应
  ipcMain.on('set-response', (event, reponse) => {
    if (spotlightWin) {
      spotlightWin.webContents.send('set-spotlight-response', reponse)
    }
  })

  ipcMain.on('shortcut-register-global', (event, key) => {
    if (store.get(SHORTCUT.global)) {
      globalShortcut.unregister(store.get(SHORTCUT.global));
    }
    store.set(SHORTCUT.global, key);
    setGlobalShortcut(key);
  });

  ipcMain.on('save-settings', (event, settings) => {
    // 保存设置到本地存储
    store.set('settings', settings);
  })

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregister('CmdOrCtrl+Space');
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit()
})

