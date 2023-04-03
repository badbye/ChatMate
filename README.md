# ChatMate

基于 Electron 的 ChatGPT 客户端。


安装依赖:

```
export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/
npm install
```

开发:
```
npx electron .
```

打包:
```
npx electron-builder --win
npx electron-builder --mac
```

## 快捷输入


对话选择
```javascript
function selectTopic(topic) {
    const conversations = document.querySelectorAll('.text-ellipsis')
    for (let i = 0; i < conversations.length; i++) {
        if (conversations[i].textContent === topic) {
            conversations[i].click()
            break
        }
    }
}
```

## 插件集成

大部分的需求可以通过插件集成的方法来解决。

- https://github.com/benf2004/ChatGPT-Prompt-Genius
- https://chrome.google.com/webstore/detail/voice-control-for-openai/baahncfnjojaofhdmdfkpeadigoemkif
- https://chrome.google.com/webstore/detail/voice-control-for-chatgpt/eollffkcakegifhacjnlnegohfdlidhn

后两个在 Electron 环境下暂时无法监听语言输入。