import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const socket = io("https://impostor-backend-stg4.onrender.com");

export default function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [countdown, setCountdown] = useState(0); // Added for countdown

  // test cache clear 2026
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

  // Start countdown when 4+ players in lobby
  useEffect(() => {
    if (room && room.phase === "lobby" && room.players.length >= 4 && countdown === 0) {
      setCountdown(30); // Change 30 to any seconds you want
    }
    // Reset countdown if players drop below 4
    if (room && room.players.length < 4) {
      setCountdown(0);
    }
  }, [room?.players.length, room?.phase]);

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      countdown === 0 &&
      room?.phase === "lobby" &&
      room?.players.length >= 4 &&
      isHost
    ) {
      // Auto start game when countdown ends (only host triggers it)
      socket.emit("startGame", { roomId });
    }
  }, [countdown, room?.phase, room?.players.length]);

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
      <div
        style={{
          minHeight: "100vh",
          background: "url('/background.png') center/cover no-repeat",
          color: "white",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "center",
          padding: "40px",
        }}
      >
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
        `}</style>
        <h1
          style={{
            fontSize: "70px",
            marginBottom: "30px",
            textShadow: "0 0 30px #1e40af",
            letterSpacing: "3px",
            fontWeight: "700",
          }}
        >
          Дүр эсгэгч хэн нь вэ?
        </h1>
        <p
          style={{
            fontSize: "28px",
            marginBottom: "50px",
            lineHeight: "1.6",
            fontWeight: "500",
          }}
        >
          Үдэшлэгийн тоглоом - Найзуудтайгаа цагийг сайхан өнгөрөөгөөрэй<br />
          Дор хаяж 4 тоглогчийг урьж эхлэнэ шүү
        </p>
        <input
          placeholder="Нэрээ оруул (жишээ: Баяраа)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "400px",
            padding: "20px",
            fontSize: "22px",
            borderRadius: "15px",
            border: "none",
            marginBottom: "30px",
            background: "rgba(255,255,255,0.1)",
            color: "white",
          }}
        />
        <br />
        <button
          onClick={createRoom}
          style={{
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
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
            fontWeight: "700",
          }}
        >
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
            marginBottom: "20px",
            background: "rgba(255,255,255,0.1)",
            color: "white",
          }}
        />
        <br />
        <button
          onClick={joinRoom}
          style={{
            width: "80%",
            maxWidth: "400px",
            padding: "25px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "20px",
            fontSize: "28px",
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
            fontWeight: "700",
          }}
        >
          Өрөөнд нэгдэх
        </button>
        {roomId && (
          <div style={{ marginTop: "50px" }}>
            <p style={{ fontSize: "32px", marginBottom: "20px" }}>
              Код: <strong style={{ color: "#ffff00" }}>{roomId.toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: "24px" }}>
              Найзууддаа кодыг хуулж илгээгээд нэгдүүлээрэй!
            </p>
          </div>
        )}
      </div>
    );
  }

  const isHost = room.players[0]?.id === socket.id;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "url('/background.png') center/cover no-repeat",
        color: "white",
        fontFamily: "'Montserrat', sans-serif",
        padding: "20px",
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
      <h1 style={{ textAlign: "center", fontSize: "48px", textShadow: "0 0 20px #1e40af" }}>
        Өрөө: {roomId.toUpperCase()}
      </h1>
      <p style={{ fontSize: "32px", textAlign: "center", margin: "30px 0" }}>
        Код: <strong style={{ color: "#ffff00" }}>{roomId.toUpperCase()}</strong>
      </p>

      <h3 style={{ textAlign: "center" }}>Тоглогчид ({room.players.length}/10)</h3>

      {/* Countdown Display */}
      {room.phase === "lobby" && countdown > 0 && (
        <div
          style={{
            textAlign: "center",
            fontSize: "48px",
            fontWeight: "bold",
            color: "#ffff00",
            margin: "40px 0",
            textShadow: "0 0 20px #ff6600",
          }}
        >
          Тоглоом эхлэхэд: {countdown} секунд
        </div>
      )}
      {room.phase === "lobby" && countdown > 0 && countdown <= 10 && (
        <div
          style={{
            textAlign: "center",
            fontSize: "36px",
            color: "#ff4444",
            fontWeight: "bold",
            animation: "blink 1s infinite",
          }}
        >
          Бэлэн болоорой!
        </div>
      )}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {room.players.map((p) => (
          <li
            key={p.id}
            style={{
              padding: "20px",
              fontSize: "26px",
              background: "rgba(255,255,255,0.1)",
              margin: "15px 0",
              borderRadius: "20px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            {p.name} {p.id === socket.id && "(Чи)"}
            {room.phase === "voting" && p.id !== socket.id && (
              <button
                onClick={() => vote(p.id)}
                style={{
                  marginLeft: "30px",
                  padding: "15px 30px",
                  background: "#FF5722",
                  color: "white",
                  border: "none",
                  borderRadius: "15px",
                  fontSize: "20px",
                }}
              >
                Санал өгөх
              </button>
            )}
          </li>
        ))}
      </ul>

      {myRole && (
        <div
          style={{
            padding: "30px",
            background: myRole.role === "impostor" ? "#ff4444" : "#44ff44",
            borderRadius: "20px",
            margin: "40px auto",
            maxWidth: "600px",
            fontSize: "30px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <strong>Таны үүрэг:</strong> {myRole.message}
        </div>
      )}

      <p style={{ fontSize: "28px", textAlign: "center" }}>
        <strong>Үе шат:</strong>{" "}
        {room.phase === "lobby"
          ? "Лобби"
          : room.phase === "discussion"
          ? "Ярилцах (5 мин)"
          : "Санал өгөх (1 мин)"}
      </p>

      {room.phase === "lobby" && isHost && room.players.length >= 4 && (
        <button
          onClick={startGame}
          style={{
            width: "80%",
            maxWidth: "500px",
            padding: "30px",
            background: "#FF5722",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontSize: "36px",
            cursor: "pointer",
            display: "block",
            margin: "50px auto",
            boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
          }}
        >
          Тоглоом эхлүүлэх
        </button>
      )}

      {room.phase === "lobby" && room.players.length < 4 && (
        <p style={{ color: "#ff4444", fontSize: "28px", textAlign: "center" }}>
          Хамгийн багадаа 4 тоглогч хэрэгтэй
        </p>
      )}
    </div>
  );
} 
