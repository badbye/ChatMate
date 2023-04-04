const {EXTENSIONS, validExtensionPath} = require('./utils');

// 获取新增扩展按钮和扩展列表
const addButton = document.querySelector('#add-extension');
const saveButton = document.querySelector('#save-extension');
const extensionList = document.querySelector('#extension-list');

// 在新增扩展按钮上绑定点击事件处理函数
addButton.addEventListener('click', () => {
  // 创建一个新的扩展行，并添加到扩展列表末尾
  const newRow = createExtensionRow('');
  extensionList.appendChild(newRow);
});

// 在扩展列表上绑定点击事件处理函数
extensionList.addEventListener('click', (event) => {
  const target = event.target;
  // 如果点击的是删除按钮，则删除对应的扩展行
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    const row = target.closest('tr');
    row.parentNode.removeChild(row);
  }
});

// 在保存按钮上绑定点击事件处理函数
saveButton.addEventListener('click', () => {
  // 获取所有扩展路径
  const paths = Array.from(extensionList.querySelectorAll('input'))
    .map((input) => input.value);
  const validPaths = [];  
    paths.forEach((path) => {
        if (!validExtensionPath(path)) {
            alert(`Extension [${path}] not found, will skip it.`)
        } else {
            validPaths.push(path);
        }
    });
  store.set(EXTENSIONS, validPaths);
  // 通知信息: "扩展已保存, 请重启应用程序"
  alert('Extensions saved, please restart the app.');
  showExtensionList(validPaths);
});

function showExtensionList(paths) {
  // 获取扩展列表元素
  const extensionList = document.querySelector('#extension-list');

  // 移除扩展列表中的所有行
  while (extensionList.firstChild) {
    extensionList.removeChild(extensionList.firstChild);
  }

  // 为每个路径创建一个新行，并添加到扩展列表中
  paths.forEach((path) => {
    const row = createExtensionRow(path);
    extensionList.appendChild(row);
  });
}

/**
 * 创建一个新的扩展行
 */
function createExtensionRow(path) {
  // 创建一个包含输入框和删除按钮的新行
  const row = document.createElement('tr');
  const pathInput = document.createElement('input');
  const deleteButton = document.createElement('button');
  const deleteIcon = document.createElement('i');

  // 设置输入框的属性和样式
  pathInput.type = 'text';
  pathInput.classList.add('form-control');
  pathInput.value = path;

  // 设置删除按钮的属性和样式
  deleteButton.type = 'button';
  deleteButton.classList.add('btn', 'btn-danger');
  deleteIcon.classList.add('fas', 'fa-trash');
  deleteButton.appendChild(deleteIcon);

  // 添加输入框和删除按钮到新行中
  row.appendChild(document.createElement('td').appendChild(pathInput).parentNode);
  row.appendChild(document.createElement('td').appendChild(deleteButton).parentNode);

  return row;
}

function initializeExtensions() {
  // 获取扩展路径列表
  const paths = store.get(EXTENSIONS, []);

  // 显示扩展路径列表
  showExtensionList(paths);
}

initializeExtensions();
