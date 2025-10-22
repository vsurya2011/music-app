// =============================
// Song Lists
// =============================
const tamilSongsList = [
  "songs/tamil/song1.mp3",
  "songs/tamil/song2.mp3"
];

const englishSongsList = Array.from({length: 70}, (_, i) => `songs/english/song${i+1}.mp3`);

// =============================
// Preload all songs
// =============================
const preloadedSongs = {};

[...tamilSongsList, ...englishSongsList].forEach(src => {
  const audio = new Audio(src);
  audio.preload = "auto";
  preloadedSongs[src] = audio;
});

// =============================
// Room logic
// =============================
const socket = io();
const player = document.getElementById("player");
const roomCode = localStorage.getItem("roomId") || "room1"; // fallback
document.getElementById("roomCode").innerText = roomCode;

// Join room
socket.emit("joinRoom", roomCode);

// =============================
// Change song function
// =============================
window.changeSong = function(type) {
  let songSelect = type === "tamil" ? document.getElementById("tamilSongs") : document.getElementById("englishSongs");
  const songSrc = songSelect.value;

  const audio = preloadedSongs[songSrc];
  if (audio) {
    player.src = audio.src;
    player.currentTime = 0;
    player.play();
  }

  socket.emit("playSong", { roomId: roomCode, song: songSrc, time: 0 });
};

// =============================
// Sync play/pause
// =============================
// Prevent emit loop
player.dataset.isSyncing = false;

player.onplay = () => {
  if (!player.dataset.isSyncing) {
    const relativePath = Object.keys(preloadedSongs).find(key => preloadedSongs[key].src === player.src);
    socket.emit("playSong", { roomId: roomCode, song: relativePath, time: player.currentTime });
  }
};

player.onpause = () => {
  if (!player.dataset.isSyncing) {
    socket.emit("pauseSong", { roomId: roomCode });
  }
};

// =============================
// Receive sync events
// =============================
socket.on("playSong", (data) => {
  if (data.song && player.src !== preloadedSongs[data.song].src) {
    player.src = preloadedSongs[data.song].src;
  }
  player.dataset.isSyncing = true;
  player.currentTime = data.time || 0;
  player.play().catch(err => console.log("Autoplay blocked:", err))
        .finally(() => { player.dataset.isSyncing = false });
});

socket.on("pauseSong", () => {
  player.dataset.isSyncing = true;
  player.pause();
  player.dataset.isSyncing = false;
});
