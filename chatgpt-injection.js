// 选择对话

const MAX_WAIT_SECONDS = 3;
const METHODS = {
    http: 'http',
    quick: 'quick',
}
var queryMethod = METHODS.quick;
var interval;

async function selectTopic(topic) {
    if (currentConversationTitle() === topic) {
        return true;
    }
    const conversations = document.querySelectorAll('.text-ellipsis')
    for (let i = 0; i < conversations.length; i++) {
        if (conversations[i].textContent === topic) {
            conversations[i].click()
            // current time in milliseconds
            const startTime = new Date().getTime();
            var inConversation = false;
            // Wait for the Promise to be resolved
            var interval;
            await new Promise((resolve) => {
                interval = setInterval(() => {
                    if (currentConversationTitle() === topic) {
                        resolve();
                        inConversation = true;
                    } else if (new Date().getTime() - startTime > MAX_WAIT_SECONDS * 1000) {
                        resolve();
                    }
                }, 200)
            });
            if (interval) clearInterval(interval)
            return inConversation;
        }
    }
    return false;
}

function isConversationPageLoadDone(title) {
    // check if conversation tile match
    if (!currentConversationTitle() === title) {
        return false;
    }
    // check if input is ready
    const input = document.querySelector('textarea')
    if (input && input.placeholder === 'Send a message...') {
        return true;
    }
    return false;
}

function currentConversationTitle() {
    const conversations = document.querySelectorAll('.text-ellipsis')
    for (let node of conversations) {
        if (node.parentElement.classList.contains('bg-gray-800')) {
            return node.textContent;
        }
    }
}

// 发送消息
function sendMsg(msg) {
    const textarea = document.querySelector('textarea');
    textarea.focus()
    textarea.value = msg;
    textarea.nextElementSibling.disabled = false
    textarea.nextElementSibling.click()
}

function matchQuickPrompt(text, quickPromptList) {
    for (const quickPrompt of quickPromptList) {
        const key = quickPrompt.short + ' ';
        if (text.startsWith(key)) {
            return {match: true, body: text.replace(key, ''), prompt: quickPrompt};
        }
    }
    return {match: false, body: text, prompt: Object()};
}

function sendReponse(isFinished) {
    console.log('send response for ' + queryMethod + '; isFinished: ' + isFinished)
    const x = document.querySelectorAll('.markdown')
    const response = x[x.length-1].innerHTML
    if (queryMethod === METHODS.quick) {
        window.electronAPI.setResponse({response, isFinished})
    } else if (queryMethod === METHODS.http) {
        window.electronAPI.setHttpResponse({response, isFinished})
    }
}

window.electronAPI.sendQuery((event, value) => {
    console.log('recieve value: ' + value)
    queryMethod = METHODS.quick;
    sendMsg(value)
})

window.electronAPI.sendHttpQuery((event, value) => {
    console.log('recieve http request: ' + value)
    queryMethod = METHODS.http;
    sendMsg(value)
})


window.electronAPI.sendQuickQuery(async (event, value) => {
    console.log(`value: ${JSON.stringify(value)}`)
    const {query, promptList, matchConversation} = value
    const matchQuery = matchQuickPrompt(query, promptList)
    // not match the quick prompt, send it as a normal query
    if (!matchQuery.match) {
        sendMsg(matchQuery.body)
        return
    }
    // does not need to find the conversation, just send the prompt and body
    if (!matchConversation) {
        sendMsg(matchQuery.prompt.prompt + ' ' + matchQuery.body)
        return
    }
    await selectTopic(matchQuery.prompt.title).then((inConversation) => {
        console.log('in conversation: ' + inConversation)
        if (inConversation) {
            // matched, and already in the conversation, send the body directly, ignore the prompt
            // however it is slower since we need to send query after the page is loaded
            sendMsg(matchQuery.body)
        } else {
            // matched, and not in the conversation, just use the current conversation and send the prompt and body
            sendMsg(matchQuery.prompt.prompt + ' ' + matchQuery.body)
        }
    })
})
