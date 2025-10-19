// =============================
// Preload all songs
// =============================
const tamilSongsList = [
  "songs/tamil/song1.mp3",
  "songs/tamil/song2.mp3"
];

const englishSongsList = [
  "songs/english/song1.mp3",
  "songs/english/song2.mp3"
];

// Object to store preloaded Audio objects
const preloadedSongs = {};

// Preload Tamil songs
tamilSongsList.forEach(src => {
  const audio = new Audio(src);
  audio.preload = "auto";
  preloadedSongs[src] = audio;
});

// Preload English songs
englishSongsList.forEach(src => {
  const audio = new Audio(src);
  audio.preload = "auto";
  preloadedSongs[src] = audio;
});

// =============================
// Room logic
// =============================
if (window.location.pathname.includes("room.html")) {
  const socket = io();
  const player = document.getElementById("player");
  const roomCode = localStorage.getItem("roomId");
  document.getElementById("roomCode").innerText = roomCode;

  socket.emit("joinRoom", roomCode);

  // Change song based on type
  window.changeSong = function(type) {
    let songSelect, songSrc;
    if (type === "tamil") {
      songSelect = document.getElementById("tamilSongs");
    } else {
      songSelect = document.getElementById("englishSongs");
    }
    songSrc = songSelect.value;

    // Use preloaded audio
    const audio = preloadedSongs[songSrc];
    if (audio) {
      player.src = audio.src;
      player.currentTime = 0;
      player.play();
    }

    // Emit to other users
    socket.emit("playSong", { roomId: roomCode, song: songSrc, time: 0 });
  };

  // Emit play/pause to others
  player.onplay = () => {
    socket.emit("playSong", { roomId: roomCode, song: player.src, time: player.currentTime });
  };
  player.onpause = () => {
    socket.emit("pauseSong", { roomId: roomCode });
  };

  // Receive play/pause from others
  socket.on("playSong", (data) => {
    if (data.song && player.src !== data.song) {
      player.src = data.song;
    }
    player.currentTime = data.time || 0;
    player.play().catch(err => console.log("Autoplay blocked:", err));
  });
  socket.on("pauseSong", () => {
    player.pause();
  });
}
