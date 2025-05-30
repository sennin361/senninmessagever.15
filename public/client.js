const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username') || prompt('ユーザー名を入力してください');
const keyword = urlParams.get('keyword') || prompt('あいことばを入力してください');

socket.emit('join', { username, keyword });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = `${msg.username}: ${msg.message}`;
  item.className = (msg.username === username) ? 'my-message' : 'other-message';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('system', (text) => {
  const item = document.createElement('li');
  item.textContent = text;
  item.className = 'system-message';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('banned', () => {
  alert('あなたはBANされています。チャットに参加できません。');
  window.location.href = '/';
});
