const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const CHATLOG_FILE = './chatlog.json';
const ADMIN_PASSWORD = 'sennin114514';

app.use(express.static('public'));
app.use(express.json());

// 初期化
if (!fs.existsSync(CHATLOG_FILE)) {
  fs.writeFileSync(CHATLOG_FILE, '[]', 'utf8');
}

let connectedUsers = {};
let bannedUsers = new Set();
let adminSockets = new Set();

// あいことばごとのルーム管理
function getRoomName(keyword) {
  return `room_${keyword}`;
}

// チャット履歴を読み込み
function loadChatLog() {
  const data = fs.readFileSync(CHATLOG_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

// チャット履歴を保存
function saveChatLog(log) {
  fs.writeFileSync(CHATLOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

// ログ記録用ユーティリティ
function appendLog(entry) {
  const log = loadChatLog();
  log.push(entry);
  saveChatLog(log);
}

// メインページとチャット画面
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});

app.get('/admin-login', (req, res) => {
  res.sendFile(__dirname + '/public/admin-login.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// 管理者ログインAPI
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(403).json({ success: false });
  }
});

// ソケット通信
io.on('connection', (socket) => {
  socket.on('join', ({ username, keyword }) => {
    if (bannedUsers.has(username)) {
      socket.emit('banned');
      return;
    }

    const room = getRoomName(keyword);
    socket.join(room);
    socket.username = username;
    socket.keyword = keyword;
    connectedUsers[socket.id] = { username, keyword };

    io.to(room).emit('system', `${username} が入室しました`);
    adminSockets.forEach(admin => {
      admin.emit('log', `[JOIN] ${username} (${keyword})`);
    });
  });

  socket.on('chat message', (msg) => {
    const { username, keyword } = socket;
    if (!username || !keyword) return;

    const room = getRoomName(keyword);
    const message = {
      username,
      message: msg,
      time: new Date().toISOString(),
      keyword
    };

    io.to(room).emit('chat message', message);
    appendLog(message);
  });

  socket.on('read', () => {
    const { keyword, username } = socket;
    if (!keyword || !username) return;

    const room = getRoomName(keyword);
    socket.to(room).emit('read', { username });
  });

  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    if (user) {
      const { username, keyword } = user;
      const room = getRoomName(keyword);
      io.to(room).emit('system', `${username} が退室しました`);
      adminSockets.forEach(admin => {
        admin.emit('log', `[LEAVE] ${username} (${keyword})`);
      });
      delete connectedUsers[socket.id];
    }
  });

  socket.on('admin-join', () => {
    adminSockets.add(socket);
    socket.emit('log', '[ADMIN LOGIN]');
  });

  socket.on('broadcast', (data) => {
    const { password, message, keyword } = data;
    if (password !== ADMIN_PASSWORD) return;

    if (keyword === 'ALL') {
      io.emit('system', `[管理者] ${message}`);
    } else {
      const room = getRoomName(keyword);
      io.to(room).emit('system', `[管理者] ${message}`);
    }
  });

  socket.on('ban', ({ username, password }) => {
    if (password === ADMIN_PASSWORD) {
      bannedUsers.add(username);
      io.emit('bannedUser', username);
    }
  });

  socket.on('reset', (password) => {
    if (password === ADMIN_PASSWORD) {
      saveChatLog([]);
      io.emit('system', '[システム] チャット履歴がリセットされました');
    }
  });

  socket.on('getKeywords', (password) => {
    if (password === ADMIN_PASSWORD) {
      const logs = loadChatLog();
      const keywords = [...new Set(logs.map(log => log.keyword))];
      socket.emit('keywords', keywords);
    }
  });
});

// サーバー起動
http.listen(PORT, () => {
  console.log(`Sennin Chat running on http://localhost:${PORT}`);
});
