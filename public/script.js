if (window.location.pathname.includes("room.html")) {
  const socket = io();
  const player = document.getElementById("player");
  const tamilSongs = document.getElementById("tamilSongs");
  const englishSongs = document.getElementById("englishSongs");
  const roomCode = localStorage.getItem("roomId");
  document.getElementById("roomCode").innerText = roomCode || "Unknown";

  socket.emit("joinRoom", roomCode);

  window.changeSong = function(language) {
    let song;
    if(language==='tamil') song = tamilSongs.value;
    else if(language==='english') song = englishSongs.value;

    player.src = song;
    player.currentTime = 0;
    player.play();
    socket.emit("playSong", { roomId: roomCode, song, time:0 });
  };

  player.onplay = () => {
    socket.emit("playSong", { roomId: roomCode, song: player.src, time: player.currentTime });
  };

  player.onpause = () => {
    socket.emit("pauseSong", { roomId: roomCode });
  };

  socket.on("playSong", (data) => {
    if(data.song && player.src !== data.song) player.src = data.song;
    player.currentTime = data.time || 0;
    player.play().catch(e=>console.log("Autoplay blocked:",e));
  });

  socket.on("pauseSong", () => {
    player.pause();
  });
}
