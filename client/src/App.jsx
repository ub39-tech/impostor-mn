import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    socket.on("roomCreated", ({ roomId }) => {
      setRoomId(roomId);
    });

    socket.on("updateRoom", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("yourRole", (roleData) => {
      setMyRole(roleData);
    });

    socket.on("phaseChange", (msg) => {
      alert(msg);
    });

    socket.on("gameResult", ({ result }) => {
      alert(result);
    });

    return () => {
      socket.off();
    };
  }, []);

  const createRoom = () => {
    if (!name.trim()) return alert("Нэрээ оруулна уу");
    socket.emit("createRoom", { name });
  };

  const joinRoom = () => {
    if (!name.trim() || !roomId.trim()) return alert("Нэр болон код оруулна уу");
    socket.emit("joinRoom", { roomId: roomId.toUpperCase(), name });
  };

  const startGame = () => {
    socket.emit("startGame", { roomId });
  };

  const vote = (playerId) => {
    socket.emit("submitVote", { roomId, votedId: playerId });
  };

  if (!room) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "40px" }}>Импостер / Хэн нь?</h1>
        <input
          placeholder="Нэрээ оруул"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "15px", fontSize: "18px", marginBottom: "20px" }}
        />
        <button onClick={createRoom} style={{ width: "100%", padding: "20px", background: "#4CAF50", color: "white", border: "none", fontSize: "20px", cursor: "pointer", marginBottom: "20px" }}>
          Өрөө үүсгэх
        </button>
        <input
          placeholder="Өрөөний код (жишээ: ABCD)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ width: "100%", padding: "15px", fontSize: "18px", marginBottom: "10px" }}
        />
        <button onClick={joinRoom} style={{ width: "100%", padding: "20px", background: "#2196F3", color: "white", border: "none", fontSize: "20px", cursor: "pointer" }}>
          Өрөөнд нэгдэх
        </button>
        {roomId && <p style={{ marginTop: "20px", fontSize: "24px" }}>Код: <strong>{roomId.toUpperCase()}</strong></p>}
      </div>
    );
  }

  const isHost = room.players[0]?.id === socket.id;

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Өрөө: {roomId.toUpperCase()}</h1>
      <h3>Тоглогчид ({room.players.length}/10)</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {room.players.map((p) => (
          <li key={p.id} style={{ padding: "15px", fontSize: "20px", background: "#f0f0f0", margin: "10px 0", borderRadius: "10px" }}>
            {p.name} {p.id === socket.id && "(Чи)"}
            {room.phase === "voting" && p.id !== socket.id && (
              <button onClick={() => vote(p.id)} style={{ marginLeft: "20px", padding: "10px 20px", background: "#FF5722", color: "white", border: "none" }}>
                Санал өгөх
              </button>
            )}
          </li>
        ))}
      </ul>

      {myRole && (
        <div style={{ padding: "20px", background: myRole.role === "impostor" ? "#ffcccc" : "#ccffcc", borderRadius: "10px", margin: "30px 0", fontSize: "24px", textAlign: "center" }}>
          <strong>Таны үүрэг:</strong> {myRole.message}
        </div>
      )}

      <p style={{ fontSize: "20px" }}><strong>Үе шат:</strong> {room.phase === "lobby" ? "Лобби (хүлээж байна)" : room.phase === "discussion" ? "Ярилцах (5 мин)" : "Санал өгөх (1 мин)"}</p>

      {room.phase === "lobby" && isHost && room.players.length >= 4 && (
        <button onClick={startGame} style={{ width: "100%", padding: "25px", background: "#FF5722", color: "white", border: "none", fontSize: "28px", cursor: "pointer" }}>
          Тоглоом эхлүүлэх
        </button>
      )}
      {room.phase === "lobby" && room.players.length < 4 && (
        <p style={{ color: "red", fontSize: "20px" }}>Хамгийн багадаа 4 тоглогч хэрэгтэй</p>
      )}
    </div>
  );
}