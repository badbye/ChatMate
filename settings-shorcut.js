const {SHORTCUT} = require('./utils');

//------------- set shortcut ----------------
const quickTypeShortcut = document.querySelector('#quick-type-shortcut');
const menuBarShorcut = document.querySelector('#menu-bar-shortcut');
const shortcuts = [
  {input: quickTypeShortcut, key: SHORTCUT.global, recording: false},
  {input: menuBarShorcut, key: SHORTCUT.menu, recording: false}
]
let keysPressed = [];

shortcuts.forEach((shortcut) => {
  // set initial value
  if (store.get(shortcut.key)) {
    shortcut.input.value = store.get(shortcut.key);
  }

  shortcut.input.addEventListener('focus', () => {
    shortcut.recording = true;
    keysPressed = [];
    shortcut.input.value = '';
  })

  shortcut.input.addEventListener('blur', () => {
    shortcut.recording = false;
  });

  shortcut.input.addEventListener('keydown', (event) => {
    if (shortcut.recording) {
      event.preventDefault();
      keysPressed.push(event.key);
      shortcut.input.value = keysPressed.join(' + ');
    }
  })

  shortcut.input.addEventListener('keyup', (event) => {
    if (shortcut.recording) {
      event.preventDefault();
      const accelerator = keysPressed.join('+');
      ipcRenderer.send('shortcut-register', {accelerator, cacheKey: shortcut.key});
      shortcut.input.blur();
      keysPressed = [];
    }
  })
})

//------------- set quick prompt ----------------
// 获取“Add Quick Prompt”按钮和“Quick Prompt List”列表
const addQuickPromptButton = document.querySelector('#add-quick-prompt');
const quickPromptList = document.querySelector('#quick-prompt-list');
const saveQuickPromptButton = document.querySelector('#save-quick-prompt');
const matchConversation = document.querySelector('#match-conversation-title');
matchConversation.checked = store.get(SHORTCUT.matchConversation, SHORTCUT.defaultMatchConversation);

matchConversation.addEventListener('change', (event) => {
  store.set(SHORTCUT.matchConversation, event.target.checked)
})

function createEmptyQuickPrompt() {
    return {title: '', prompt: '', short: ''};
}

// 在“Add Quick Prompt”按钮上绑定点击事件处理函数
addQuickPromptButton.addEventListener('click', () => {
  // 创建一个新的快捷提示行，并添加到列表末尾
  const newRow = createQuickPromptRow(createEmptyQuickPrompt());
  quickPromptList.appendChild(newRow);
});

// 在“Quick Prompt List”列表上绑定点击事件处理函数
quickPromptList.addEventListener('click', (event) => {
  const target = event.target;
  // 如果点击的是删除按钮，则删除对应的快捷提示行
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    const row = target.closest('tr');
    row.parentNode.removeChild(row);
  }
});


saveQuickPromptButton.addEventListener('click', () => {
    saveQuickPromptList()
})

  /**
 * 创建一个新的快捷提示行
 * @param {Object} quickPrompt 包含快捷提示信息的对象，包括 title、prompt 和 short 属性
 */
function createQuickPromptRow(quickPrompt) {
    // 创建一个包含输入框和删除按钮的新行
    const row = document.createElement('tr');
    const shortcutInput = document.createElement('input');
    const promptTextarea = document.createElement('textarea');
    const titleInput = document.createElement('input');

    const deleteButton = document.createElement('button');
    const deleteIcon = document.createElement('i');
  
    // 设置输入框和文本域的属性和样式
    shortcutInput.type = 'text';
    shortcutInput.classList.add('form-control', 'shortcut-input');
    shortcutInput.value = quickPrompt.short;
    promptTextarea.classList.add('form-control', 'prompt-textarea', 'prompt-input');
    promptTextarea.textContent = quickPrompt.prompt;
    titleInput.type = 'text';
    titleInput.classList.add('form-control', 'title-input');
    titleInput.value = quickPrompt.title;
    
    // 设置删除按钮的属性和样式
    deleteButton.type = 'button';
    deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
    deleteIcon.classList.add('fas', 'fa-trash');
    deleteButton.appendChild(deleteIcon);
  
    // 添加输入框、文本域、按钮到新行中
    row.appendChild(document.createElement('td').appendChild(shortcutInput).parentNode);
    row.appendChild(document.createElement('td').appendChild(promptTextarea).parentNode);
    row.appendChild(document.createElement('td').appendChild(titleInput).parentNode);
    row.appendChild(document.createElement('td').appendChild(deleteButton).parentNode);
    return row;
}

function validPrompt(prompt) {
    return prompt.short && prompt.title && prompt.prompt;
}

function initializeQuickPromptList() {
    showPromptList(store.get(SHORTCUT.quickPromptList) || []);
}

// save quick prompt
function saveQuickPromptList() {
    // 获取所有的快捷提示行
    const quickPromptRows = quickPromptList.querySelectorAll('tr');
    // 遍历快捷提示行，获取每个快捷提示行中的输入框和文本域的值
    const promptListToSave = [];
    quickPromptRows.forEach((row) => {
      const shortcutInput = row.querySelector('.shortcut-input');
      const promptTextarea = row.querySelector('.prompt-textarea');
      const titleInput = row.querySelector('.title-input');
      const quickPrompt = {
        short: shortcutInput.value,
        prompt: promptTextarea.value,
        title: titleInput.value,
      };
      // 如果快捷提示行中的输入框和文本域都有值，则将快捷提示添加到快捷提示列表中
      if (validPrompt(quickPrompt)) {
        promptListToSave.push(quickPrompt);
      } else {
        alert(`${JSON.stringify(quickPrompt)} is not valid, will skip it`);
      }
    });
    // 将快捷提示列表保存到本地存储
    store.set(SHORTCUT.quickPromptList, promptListToSave);
    showPromptList(promptListToSave);
    alert('Saved');
}

function showPromptList(promptList) {
    // 清空快捷提示列表
    quickPromptList.innerHTML = '';
    // 遍历快捷提示列表，为每个快捷提示创建一个新的快捷提示行
    promptList.forEach((quickPrompt) => {
      const newRow = createQuickPromptRow(quickPrompt);
      quickPromptList.appendChild(newRow);
    });
}
initializeQuickPromptList();
