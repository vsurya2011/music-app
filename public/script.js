const tamilSongsList = ["songs/tamil/song1.mp3","songs/tamil/song2.mp3"];
const englishSongsList = Array.from({length:70},(_,i)=>`songs/english/song${i+1}.mp3`);
const preloadedSongs = {};

[...tamilSongsList, ...englishSongsList].forEach(src=>{
  const audio = new Audio(src);
  audio.preload = "auto";
  preloadedSongs[src] = audio;
});

const socket = io();
const player = document.getElementById("player");
const roomCode = localStorage.getItem("roomId") || "room1";
document.getElementById("roomCode").innerText = roomCode;

socket.emit("joinRoom", roomCode);

let isSyncing = false;

// Change song
window.changeSong = function(type){
  const songSelect = type==="tamil"?document.getElementById("tamilSongs"):document.getElementById("englishSongs");
  const songSrc = songSelect.value;
  const audio = preloadedSongs[songSrc];
  if(audio){
    player.src = audio.src;
    player.currentTime = 0;
    player.play();
  }
  socket.emit("playSong",{roomId:roomCode,song:songSrc,time:0});
};

// Play/pause events
player.onplay = ()=>{
  if(!isSyncing){
    const song = Object.keys(preloadedSongs).find(key=>preloadedSongs[key].src===player.src);
    socket.emit("playSong",{roomId:roomCode,song,time:player.currentTime});
  }
};

player.onpause = ()=>{
  if(!isSyncing){
    socket.emit("pauseSong",{roomId:roomCode});
  }
};

// Receive play/pause
socket.on("playSong",data=>{
  const audioSrc = preloadedSongs[data.song]?.src;
  if(audioSrc && player.src!==audioSrc){
    player.src = audioSrc;
  }
  isSyncing = true;
  player.currentTime = data.time || 0;
  player.play().catch(()=>{}).finally(()=>{isSyncing=false;});
});

socket.on("pauseSong",()=>{
  isSyncing=true;
  player.pause();
  isSyncing=false;
});

// Receive real-time timestamp updates
socket.on("syncTime",data=>{
  const audioSrc = preloadedSongs[data.song]?.src;
  if(audioSrc && player.src!==audioSrc){
    player.src = audioSrc;
  }
  if(!player.paused){
    isSyncing=true;
    player.currentTime = data.time;
    isSyncing=false;
  }
});
