const socket = io();
let username = localStorage.getItem('username') || '';
let keyword = localStorage.getItem('keyword') || '';

// ページ読み込み時に参加
if (username && keyword) {
  socket.emit('join', { username, keyword });
} else {
  username = prompt('名前を入力してください');
  keyword = prompt('あいことばを入力してください');
  localStorage.setItem('username', username);
  localStorage.setItem('keyword', keyword);
  socket.emit('join', { username, keyword });
}

// メッセージ送信
document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.getElementById('m');
  const message = input.value.trim();
  if (message) {
    socket.emit('chat message', message);
    input.value = '';
  }
});

// メッセージ受信
socket.on('chat message', function (msg) {
  const item = document.createElement('div');
  item.className = msg.username === username ? 'my-message' : 'other-message';
  item.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
  document.getElementById('messages').appendChild(item);
  scrollToBottom();
});

// 入退室などのシステムメッセージ受信
socket.on('system', function (message) {
  const systemMsg = document.createElement('div');
  systemMsg.className = 'system-message';
  systemMsg.textContent = message;
  document.getElementById('messages').appendChild(systemMsg);
  scrollToBottom();
});

// 既読通知受信
socket.on('read', function (data) {
  const readMsg = document.createElement('div');
  readMsg.className = 'read-message';
  readMsg.textContent = `${data.username} さんが既読しました`;
  document.getElementById('messages').appendChild(readMsg);
  scrollToBottom();
});

// BANされた場合
socket.on('banned', function () {
  alert('あなたはBANされました');
  window.location.href = '/';
});

function scrollToBottom() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}
