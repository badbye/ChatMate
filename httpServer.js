// this is a mock server of chatGPT: 

const http = require('http');
const url = require('url');
const { ipcMain } = require('electron');
const TurndownService = require('turndown');
const turndownService = new TurndownService();

var HTTP_QUERING = false;
var server;
const HTTP_RESPONSE_EVENT = 'set-http-response';

function isHttpQuerying() { return HTTP_QUERING; }

function httpReponse(content) {
  return {
    id: Math.floor(Math.random() * 1000000).toString(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: content,
      },
      finish_reason: "stop"
    }],
    usage: {
      prompt_tokens: 9,
      completion_tokens: 12,
      total_tokens: 21
    }
  }
}

function addListener(resolve)  {
  return (event, result) => {
    console.log('recieve response from chatGPTWin: ' + JSON.stringify(result))
    if (result.isFinished) {
      resolve(turndownService.turndown(result.response));
    }
  }
}

function removeListeners() {
  ipcMain.removeAllListeners(HTTP_RESPONSE_EVENT);
}

function handleRequest(chatGPTWin, messages) {
  return new Promise((resolve, reject) => {
    // 向渲染进程发送请求
    const input = messages.map(x => x.role + ': ' + x.content).join('\n')
    chatGPTWin.webContents.send('send-http-query', input)

    // 监听来自渲染进程的响应
    ipcMain.on(HTTP_RESPONSE_EVENT, addListener(resolve));

    // 设置超时以防止未收到响应
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 30000); // 设置为 30 秒超时
  });
}

function startHttpServer(chatGPTWin) {
  // 创建一个 HTTP 服务器
  server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
  
    res.setHeader('Content-Type', 'application/json');
  
    if (method === 'POST' && parsedUrl.pathname === '/v1/chat/completions') {
      HTTP_QUERING = true;
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
  
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const { model, messages } = data;
  
          // 您可以在这里处理请求数据
          console.log('Model:', model);
          console.log('Messages:', messages);
          // combine messages into a single string
          const result = await handleRequest(chatGPTWin, messages);
          removeListeners();
          HTTP_QUERING = false;
          res.end(JSON.stringify(httpReponse(result)));
        } catch (error) {
          res.statusCode = 400;
          HTTP_QUERING = false;
          res.end(JSON.stringify({ error: error.message || 'Bad request' }));
        }
      });
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  // 监听端口
  const port = 80;
  server.listen(port, () => {
    console.log(`HTTP server running on port ${port}`);
  });
}

function stopHttpServer() {
  if (server) server.close();
}

module.exports = {
  startHttpServer,
  stopHttpServer,
  isHttpQuerying
};
