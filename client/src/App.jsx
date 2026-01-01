import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import QRCode from "qrcode.react";

const socket = io("https://impostor-backend-stg4.onrender.com");

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
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0f0c29, #302b63, #24243e)",
        color: "white",
        fontFamily: "'Segoe UI', sans-serif",
        textAlign: "center",
        padding: "40px"
      }}>
        <h1 style={{
          fontSize: "60px",
          marginBottom: "20px",
          textShadow: "0 0 20px #ff00ff",
          letterSpacing: "2px"
        }}>
          Импостер / Хэн нь?
        </h1>
        <p style={{ fontSize: "24px", marginBottom: "40px" }}>
          Монгол party game – найзуудтайгаа тоглоорой! 🇲🇳
        </p>

        <input
          placeholder="Нэрээ оруул (жишээ: Түмүр)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "400px",
            padding: "20px",
            fontSize: "22px",
            borderRadius: "15px",
            border: "none",
            marginBottom: "30px"
          }}
        />
        <br />

        <button onClick={createRoom} style={{
          width: "80%",
          maxWidth: "400px",
          padding: "25px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "20px",
          fontSize: "28px",
          cursor: "pointer",
          marginBottom: "30px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
        }}>
          Өрөө үүсгэх
        </button>
        <br />

        <input
          placeholder="Өрөөний код (жишээ: ABCD)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "400px",
            padding: "20px",
            fontSize: "22px",
            borderRadius: "15px",
            border: "none",
            marginBottom: "20px"
          }}
        />
        <br />

        <button onClick={joinRoom} style={{
          width: "80%",
          maxWidth: "400px",
          padding: "25px",
          background: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "20px",
          fontSize: "28px",
          cursor: "pointer",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
        }}>
          Өрөөнд нэгдэх
        </button>

        {roomId && (
          <div style={{ marginTop: "50px" }}>
            <p style={{ fontSize: "28px", marginBottom: "20px" }}>
              Код: <strong style={{ color: "#ffff00" }}>{roomId.toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: "24px" }}>Утаснаасаа скан хийгээд нэгдээрэй:</p>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", display: "inline-block" }}>
              <QRCode
                value={`https://impostor-mn.vercel.app?room=${roomId.toUpperCase()}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHost = room.players[0]?.id === socket.id;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0f0c29, #302b63, #24243e)",
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px"
    }}>
      <h1 style={{ textAlign: "center", fontSize: "48px", textShadow: "0 0 20px #ff00ff" }}>
        Өрөө: {roomId.toUpperCase()}
      </h1>

      {roomId && (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <p style={{ fontSize: "22px" }}>Утаснаасаа скан хийгээд нэгдээрэй:</p>
          <div style={{ background: "white", padding: "15px", borderRadius: "15px", display: "inline-block" }}>
            <QRCode value={`https://impostor-mn.vercel.app?room=${roomId.toUpperCase()}`} size={200} level="H" />
          </div>
        </div>
      )}

      <h3 style={{ textAlign: "center" }}>Тоглогчид ({room.players.length}/10)</h3>
      <ul style={{ listStyle: "none", padding: 0, maxWidth: "600px", margin: "0 auto" }}>
        {room.players.map((p) => (
          <li key={p.id} style={{
            padding: "20px",
            fontSize: "26px",
            background: "rgba(255,255,255,0.1)",
            margin: "15px 0",
            borderRadius: "20px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)"
          }}>
            {p.name} {p.id === socket.id && "(Чи)"}
            {room.phase === "voting" && p.id !== socket.id && (
              <button onClick={() => vote(p.id)} style={{
                marginLeft: "30px",
                padding: "15px 30px",
                background: "#FF5722",
                color: "white",
                border: "none",
                borderRadius: "15px",
                fontSize: "20px"
              }}>
                Санал өгөх
              </button>
            )}
          </li>
        ))}
      </ul>

      {myRole && (
        <div style={{
          padding: "30px",
          background: myRole.role === "impostor" ? "#ff4444" : "#44ff44",
          borderRadius: "20px",
          margin
