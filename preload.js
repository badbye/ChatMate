const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
  // 能暴露的不仅仅是函数，我们还可以暴露变量
})

contextBridge.exposeInMainWorld('electronAPI', {
    sendQuery: (callback) => ipcRenderer.on('send-query', callback),
    sendQuickQuery: (callback) => ipcRenderer.on('send-quick-query', callback),
    setResponse: (response) => ipcRenderer.send('set-response', response)
})