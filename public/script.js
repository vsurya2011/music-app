if (window.location.pathname.includes("room.html")) {
  const socket = io(); // make sure server is running
  const player = document.getElementById("player");
  const tamilSongs = document.getElementById("TamilSongs");
  const englishSongs = document.getElementById("EnglishSongs");

  const roomCode = localStorage.getItem("roomId");
  const username = localStorage.getItem("username") || "Guest";

  if (!roomCode) {
    alert("Room not found! Go back to homepage.");
    window.location.href = "index.html";
  }

  document.getElementById("roomCode").innerText = roomCode;

  socket.emit("joinRoom", roomCode);

  window.changeSong = function(language) {
    let song;
    if (language === "tamil") song = tamilSongs.value;
    else if (language === "english") song = englishSongs.value;

    player.src = song;
    player.currentTime = 0;
    player.play();
    socket.emit("playSong", { roomId: roomCode, song, time: 0 });
  };

  player.onplay = () => {
    socket.emit("playSong", { roomId: roomCode, song: player.src, time: player.currentTime });
  };

  player.onpause = () => {
    socket.emit("pauseSong", { roomId: roomCode });
  };

  socket.on("playSong", (data) => {
    if (data.song && player.src !== data.song) player.src = data.song;
    player.currentTime = data.time || 0;
    player.play().catch(err => console.log("Autoplay blocked:", err));
  });

  socket.on("pauseSong", () => {
    player.pause();
  });
}
