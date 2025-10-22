// ============================
// Preload songs
// ============================
const tamilSongsList = ["songs/tamil/song1.mp3","songs/tamil/song2.mp3"];
const englishSongsList = Array.from({length:70},(_,i)=>`songs/english/song${i+1}.mp3`);
const preloadedSongs = {};

[...tamilSongsList,...englishSongsList].forEach(src=>{
  const audio = new Audio(src);
  audio.preload = "auto";
  preloadedSongs[src] = audio;
});

// ============================
// Socket + player setup
// ============================
const socket = io();
const player = document.getElementById("player");
const roomCode = localStorage.getItem("roomId") || "room1";
document.getElementById("roomCode").innerText = roomCode;

let isSyncing = false; // prevent loop
let userStarted = false; // audio context unlocked

// ============================
// Unlock audio with start button
// ============================
const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", ()=>{
  // unlock audio context
  const audioTest = new Audio();
  audioTest.play().catch(()=>{});
  startBtn.style.display = "none";
  userStarted = true;

  // join room after unlock
  socket.emit("joinRoom", roomCode);
});

// ============================
// Change song function
// ============================
window.changeSong = function(type){
  if(!userStarted) { alert("Click Start Listening first!"); return; }

  const songSelect = type==="tamil"?document.getElementById("tamilSongs"):document.getElementById("englishSongs");
  const songSrc = songSelect.value;
  const audio = preloadedSongs[songSrc];

  if(audio){
    player.src = audio.src;
    player.currentTime = 0;
    player.play().catch(()=>{});
  }

  socket.emit("playSong",{roomId:roomCode,song:songSrc,time:0});
};

// ============================
// Play/pause events
// ============================
player.onplay = ()=>{
  if(!isSyncing && userStarted){
    const song = Object.keys(preloadedSongs).find(key=>preloadedSongs[key].src===player.src);
    socket.emit("playSong",{roomId:roomCode,song,time:player.currentTime});
  }
};

player.onpause = ()=>{
  if(!isSyncing && userStarted){
    socket.emit("pauseSong",{roomId:roomCode});
  }
};

// ============================
// Receive play/pause
// ============================
socket.on("playSong",data=>{
  if(!userStarted) return; // wait for interaction
  const audioSrc = preloadedSongs[data.song]?.src;
  if(!audioSrc) return;

  if(player.src!==audioSrc){
    player.src = audioSrc;
    player.load();
  }

  isSyncing = true;
  player.currentTime = data.time || 0;
  player.play().catch(()=>{}).finally(()=>{isSyncing=false;});
});

socket.on("pauseSong",()=>{
  if(!userStarted) return;
  isSyncing = true;
  player.pause();
  isSyncing = false;
});

// ============================
// Real-time timestamp sync every 0.5s
// ============================
setInterval(()=>{
  if(userStarted && !isSyncing && !player.paused){
    const song = Object.keys(preloadedSongs).find(key=>preloadedSongs[key].src===player.src);
    if(song){
      socket.emit("playSong",{roomId:roomCode,song,time:player.currentTime});
    }
  }
},500);
