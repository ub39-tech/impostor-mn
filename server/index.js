const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let rooms = {};

const topics = [
  "Наадам",
  "Монгол гэр",
  "Морин уралдаан",
  "Сур харваа",
  "Бөх",
  "Хуур",
  "Монгол хувцас",
  "Цагаан сар",
  "Улаанбаатар",
  "Хөдөө",
  "Айраг",
  "Хуушуур",
  "Бууз",
  "Монгол дуу",
  "Түүх",
  "Чингис хаан",
  "Өвөл",
  "Зун",
  "Говь",
  "Хөвсгөл"
];

io.on("connection", (socket) => {
  console.log("Тоглогч холбогдлоо:", socket.id);

  socket.on("createRoom", ({ name }) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms[roomId] = {
      players: [{ id: socket.id, name }],
      phase: "lobby",
      discussionEndTime: null,
      votingEndTime: null
    };
    socket.join(roomId);
    socket.emit("roomCreated", { roomId });
    io.to(roomId).emit("updateRoom", rooms[roomId]);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    if (!rooms[roomId]) return socket.emit("error", "Өрөө олдсонгүй");
    if (rooms[roomId].players.length >= 10) return socket.emit("error", "Өрөө дүүрсэн");
    rooms[roomId].players.push({ id: socket.id, name });
    socket.join(roomId);
    io.to(roomId).emit("updateRoom", rooms[roomId]);
  });

  socket.on("startGame", ({ roomId }) => {
    if (!rooms[roomId] || rooms[roomId].players.length < 4) return;
    const players = rooms[roomId].players;
    const impostorIndex = Math.floor(Math.random() * players.length);
    const topic = topics[Math.floor(Math.random() * topics.length)];

    players.forEach((p, i) => {
      const role = i === impostorIndex ? "impostor" : "normal";
      const message = role === "impostor" ? "Чи импостер! Сэдвийг мэдэхгүй дүр эсгэ." : `Сэдэв: ${topic}`;
      io.to(p.id).emit("yourRole", { role, message });
    });

    rooms[roomId].phase = "discussion";
    rooms[roomId].discussionEndTime = Date.now() + 5 * 60 * 1000; // 5 мин
    rooms[roomId].votingEndTime = rooms[roomId].discussionEndTime + 1 * 60 * 1000; // 1 мин

    io.to(roomId).emit("updateRoom", rooms[roomId]);
    io.to(roomId).emit("phaseChange", "Ярилцах үе шат эхэллээ (5 мин)");

    // Timer илгээх
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const timeLeft = rooms[roomId]?.phase === "discussion" ? rooms[roomId].discussionEndTime - now : rooms[roomId].votingEndTime - now;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (rooms[roomId].phase === "discussion") {
          rooms[roomId].phase = "voting";
          io.to(roomId).emit("updateRoom", rooms[roomId]);
          io.to(roomId).emit("phaseChange", "Санал өгөх үе шат эхэллээ (1 мин)");
        }
      } else {
        io.to(roomId).emit("timerUpdate", { timeLeft });
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(timerInterval);
      if (rooms[roomId] && rooms[roomId].phase === "discussion") {
        rooms[roomId].phase = "voting";
        io.to(roomId).emit("updateRoom", rooms[roomId]);
        io.to(roomId).emit("phaseChange", "Санал өгөх үе шат эхэллээ (1 мин)");
      }
    }, 5 * 60 * 1000);

    setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].phase === "voting") {
        endGame(roomId);
      }
    }, 6 * 60 * 1000);
  });

  socket.on("submitVote", ({ roomId, votedId }) => {
    if (!rooms[roomId]) return;
    if (!rooms[roomId].votes) rooms[roomId].votes = {};
    rooms[roomId].votes[socket.id] = votedId;
    io.to(roomId).emit("updateRoom", rooms[roomId]);

    if (Object.keys(rooms[roomId].votes).length === rooms[roomId].players.length) {
      endGame(roomId);
    }
  });

  function endGame(roomId) {
    if (!rooms[roomId]) return;
    const votes = rooms[roomId].votes || {};
    const voteCount = {};
    Object.values(votes).forEach(v => voteCount[v] = (voteCount[v] || 0) + 1);

    let maxVotes = 0;
    let votedOut = null;
    for (let playerId in voteCount) {
      if (voteCount[playerId] > maxVotes) {
        maxVotes = voteCount[playerId];
        votedOut = playerId;
      }
    }

    const impostor = rooms[roomId].players.find(p => p.role === "impostor");
    const result = votedOut === impostor?.id ? "Энгийн тоглогчид хожлоо!" : "Импостер хожлоо!";

    io.to(roomId).emit("gameResult", { result });
    delete rooms[roomId];
  }

  socket.on("disconnect", () => {
    console.log("Тоглогч саллаа:", socket.id);
    for (let roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
      else io.to(roomId).emit("updateRoom", rooms[roomId]);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Сервер ${PORT} порт дээр ажиллаж байна`);
});
