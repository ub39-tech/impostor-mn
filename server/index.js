const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

const topics = [
  "Цайны газар",
  "Сургууль",
  "Автобус",
  "Наадам",
  "Гэр",
  "Дэлгүүр",
  "Зоогийн газар",
  "Төмөр зам",
  "Зах",
  "Оффис",
  "Гэр бүлийн өдөр",
  "Мал маллах"
];

io.on("connection", (socket) => {
  console.log("Хэрэглэгч холбогдлоо:", socket.id);

  socket.on("createRoom", ({ name }) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms[roomId] = {
      players: [{ id: socket.id, name, vote: null }],
      phase: "lobby",
      topic: "",
      impostorId: "",
      discussionTimer: null,
      votingTimer: null
    };
    socket.join(roomId);
    socket.emit("roomCreated", { roomId });
    io.to(roomId).emit("updateRoom", rooms[roomId]);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    if (!rooms[roomId]) {
      socket.emit("error", "Өрөө олдсонгүй");
      return;
    }
    rooms[roomId].players.push({ id: socket.id, name, vote: null });
    socket.join(roomId);
    io.to(roomId).emit("updateRoom", rooms[roomId]);
  });

  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.players.length < 4 || room.phase !== "lobby") return;

    const topic = topics[Math.floor(Math.random() * topics.length)];
    const impostorIndex = Math.floor(Math.random() * room.players.length);
    const impostorId = room.players[impostorIndex].id;

    room.topic = topic;
    room.impostorId = impostorId;
    room.phase = "discussion";

    room.players.forEach(player => {
      if (player.id === impostorId) {
        io.to(player.id).emit("yourRole", { role: "impostor", message: "Чи импостер! Сэдвийг мэдэхгүй дүр эсгэ." });
      } else {
        io.to(player.id).emit("yourRole", { role: "normal", message: `Сэдэв: ${topic}` });
      }
    });

    io.to(roomId).emit("updateRoom", room);
    io.to(roomId).emit("phaseChange", "Ярилцах хугацаа эхэллээ (5 мин)");

    room.discussionTimer = setTimeout(() => {
      room.phase = "voting";
      room.players.forEach(p => p.vote = null);
      io.to(roomId).emit("updateRoom", room);
      io.to(roomId).emit("phaseChange", "Санал өгөх хугацаа (1 мин)");

      room.votingTimer = setTimeout(() => endVoting(roomId), 60000);
    }, 300000);
  });

  socket.on("submitVote", ({ roomId, votedId }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== "voting") return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.vote = votedId;
    io.to(roomId).emit("updateRoom", room);
  });

  function endVoting(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    const voteCounts = {};
    room.players.forEach(p => {
      if (p.vote) voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
    });
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const votedOut = Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes) || null;

    let result = "";
    if (votedOut === room.impostorId && votedOut) {
      result = "Энгийн тоглогчид хожлоо! Импостер илэрлээ.";
    } else {
      result = "Импостер хожлоо!";
    }

    io.to(roomId).emit("gameResult", { result, votedOut: votedOut || "Хэн ч биш", impostorId: room.impostorId });

    room.phase = "lobby";
    room.topic = "";
    room.impostorId = "";
    room.players.forEach(p => p.vote = null);
    clearTimeout(room.discussionTimer);
    clearTimeout(room.votingTimer);
    io.to(roomId).emit("updateRoom", room);
  }

  socket.on("disconnect", () => {
    console.log("Хэрэглэгч саллаа:", socket.id);
  });
});

server.listen(3001, () => console.log("Сервер 3001 порт дээр ажиллаж байна"));