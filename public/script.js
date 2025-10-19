// =============================
// index.html logic
// =============================
function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8);
  document.getElementById("room").value = roomId;
  joinRoom();
}

function joinRoom() {
  const roomId = document.getElementById("room").value;
  const username = document.getElementById("username").value || "Guest";
  if (!roomId) return alert("Please enter or create a room code!");
  localStorage.setItem("roomId", roomId);
  localStorage.setItem("username", username);
  window.location.href = `room.html`;
}

// =============================
// room.html logic
// =============================
if (window.location.pathname.includes("room.html")) {
  const socket = io();
  const player = document.getElementById("player");
  const songSelect = document.getElementById("songSelect");
  const roomCode = localStorage.getItem("roomId");
  document.getElementById("roomCode").innerText = roomCode;

  socket.emit("joinRoom", roomCode);

  // ✅ When a user changes the song
  window.changeSong = function () {
    const song = songSelect.value;
    player.src = song;
    player.currentTime = 0;
    player.play();
    socket.emit("playSong", { roomId: roomCode, song, time: 0 });
  };

  // ✅ When a user plays the song
  player.onplay = () => {
    socket.emit("playSong", { roomId: roomCode, song: player.src, time: player.currentTime });
  };

  // ✅ When a user pauses the song
  player.onpause = () => {
    socket.emit("pauseSong", { roomId: roomCode });
  };

  // ✅ When another user plays
  socket.on("playSong", (data) => {
    if (data.song && player.src !== data.song) {
      player.src = data.song;
    }
    player.currentTime = data.time || 0;
    player.play().catch(err => console.log("Autoplay blocked:", err));
  });

  // ✅ When another user pauses
  socket.on("pauseSong", () => {
    player.pause();
  });
}
