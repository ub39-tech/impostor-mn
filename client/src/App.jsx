import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import QRCode from "qrcode.react";  // QR code library

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
                value={`https://im
