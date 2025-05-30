// Socket.IO接続開始
const socket = io();

// 要素取得
const loginForm = document.getElementById('loginForm');
const chatForm = document.getElementById('chatForm');
const usernameInput = document.getElementById('usernameInput');
const keywordInput = document.getElementById('keywordInput');
const msgInput = document.getElementById('msgInput');
const chatArea = document.getElementById('chatArea');
const loginSection = document.getElementById('loginSection');
const chatSection = document.getElementById('chatSection');

let username = '';
let keyword = '';
let isAdmin = false;

// ログインフォーム送信処理
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  username = usernameInput.value.trim();
  keyword = keywordInput.value.trim();

  if (!username) {
    alert('ユーザー名を入力してください');
    return;
  }
  if (!keyword) {
    alert('あいことばを入力してください');
    return;
  }

  // 管理者判定（例：usernameが admin の場合）
  if (username.toLowerCase() === 'admin') {
    isAdmin = true;
  }

  // サーバーに入室リクエストを送信
  socket.emit('join room', { username, keyword, isAdmin });
});

// サーバーから入室承認が来たらチャット画面表示
socket.on('join success', () => {
  loginSection.style.display = 'none';
  chatSection.style.display = 'block';
  msgInput.focus();
});

// 入室拒否
socket.on('join failure', (msg) => {
  alert(msg);
});

// メッセージ送信フォーム処理
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = msgInput.value.trim();
  if (!message) return;
  // メッセージをサーバーに送信
  socket.emit('chat message', { username, message, keyword, isAdmin });
  msgInput.value = '';
});

// サーバーからのチャットメッセージ受信
socket.on('chat message', (data) => {
  // data = { username, message, isAdmin }

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  // 吹き出しの色を設定
  if (data.isAdmin) {
    messageDiv.classList.add('admin-message');  // 黄色
  } else if (data.username === username) {
    messageDiv.classList.add('my-message');     // 緑色
  } else {
    messageDiv.classList.add('other-message');  // 白色
  }

  // ユーザー名表示（管理者は「管理者」と表示）
  const userSpan = document.createElement('span');
  userSpan.classList.add('username');
  userSpan.textContent = data.isAdmin ? '管理者' : data.username;

  // メッセージテキスト
  const textSpan = document.createElement('span');
  textSpan.classList.add('text');
  textSpan.textContent = data.message;

  messageDiv.appendChild(userSpan);
  messageDiv.appendChild(textSpan);
  chatArea.appendChild(messageDiv);

  // 最新スクロール
  chatArea.scrollTop = chatArea.scrollHeight;
});

// 入退室メッセージ
socket.on('system message', (msg) => {
  const sysDiv = document.createElement('div');
  sysDiv.classList.add('system-message');
  sysDiv.textContent = msg;
  chatArea.appendChild(sysDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
});
