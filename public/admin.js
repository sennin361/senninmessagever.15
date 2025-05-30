const socket = io();

const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const userCountElem = document.getElementById('user-count');
const chatLogElem = document.getElementById('chat-log');
const adminMessageForm = document.getElementById('admin-message-form');
const adminMessageInput = document.getElementById('admin-message-input');
const banForm = document.getElementById('ban-form');
const banUsernameInput = document.getElementById('ban-username');
const keywordsList = document.getElementById('keywords-list');

let loggedIn = false;

// 管理者パスワード（サーバー側でも確認）
const ADMIN_PASSWORD = 'sennin114514';

// ログインフォーム送信時
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  if (adminPasswordInput.value === ADMIN_PASSWORD) {
    loggedIn = true;
    loginForm.style.display = 'none';
    adminPanel.style.display = 'block';
    socket.emit('admin-login', { password: ADMIN_PASSWORD });
  } else {
    alert('パスワードが違います。');
  }
});

// ログアウト処理
logoutBtn.addEventListener('click', () => {
  loggedIn = false;
  adminPanel.style.display = 'none';
  loginForm.style.display = 'block';
  adminPasswordInput.value = '';
  socket.emit('admin-logout');
});

// 接続ユーザー数更新
socket.on('update-user-count', count => {
  userCountElem.textContent = count;
});

// チャットログ更新
socket.on('update-chat-log', log => {
  chatLogElem.textContent = JSON.stringify(log, null, 2);
});

// 管理者からのメッセージ送信
adminMessageForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!loggedIn) return alert('管理者ログインしてください');
  const msg = adminMessageInput.value.trim();
  if (!msg) return;
  socket.emit('admin-message', { message: msg });
  adminMessageInput.value = '';
});

// BAN機能
banForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!loggedIn) return alert('管理者ログインしてください');
  const username = banUsernameInput.value.trim();
  if (!username) return;
  socket.emit('admin-ban-user', { username });
  banUsernameInput.value = '';
});

// あいことば一覧更新
socket.on('update-keywords', keywords => {
  keywordsList.innerHTML = '';
  keywords.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    keywordsList.appendChild(li);
  });
});
