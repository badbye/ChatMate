# ChatMate

基于 Electron 的 ChatGPT 客户端。


安装依赖:

```
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/
npm install --registry http://registry.npm.taobao.org/
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

## 插件集成

大部分的需求可以通过插件集成的方法来解决，但是不一定好用。Electron 只支持少量的 Chrome API。

- https://github.com/benf2004/ChatGPT-Prompt-Genius
- https://chrome.google.com/webstore/detail/voice-control-for-openai/baahncfnjojaofhdmdfkpeadigoemkif
- https://chrome.google.com/webstore/detail/voice-control-for-chatgpt/eollffkcakegifhacjnlnegohfdlidhn

## HTTP API

模拟 [ChatGPT API](https://platform.openai.com/docs/api-reference/chat/create).

