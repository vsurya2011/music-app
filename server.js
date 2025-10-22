import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/room/:roomId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

// Room state
const rooms = {}; // { roomId: { song, time, playing, interval } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Send current state to new user
    if (rooms[roomId]) {
      const { song, time, playing } = rooms[roomId];
      socket.emit("playSong", { song, time, playing });
    }
  });

  socket.on("playSong", (data) => {
    const { roomId, song, time } = data;

    // Save room state
    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId].song = song;
    rooms[roomId].time = time;
    rooms[roomId].playing = true;

    // Clear any existing interval
    if (rooms[roomId].interval) clearInterval(rooms[roomId].interval);

    // Start interval to update timestamp every 500ms
    rooms[roomId].interval = setInterval(() => {
      rooms[roomId].time += 0.5; // increment 0.5 sec
      socket.to(roomId).emit("syncTime", { song: rooms[roomId].song, time: rooms[roomId].time });
    }, 500);

    // Broadcast play to all others
    socket.to(roomId).emit("playSong", { song, time, playing: true });
  });

  socket.on("pauseSong", (data) => {
    const { roomId } = data;

    if (rooms[roomId]) {
      rooms[roomId].playing = false;
      if (rooms[roomId].interval) {
        clearInterval(rooms[roomId].interval);
        rooms[roomId].interval = null;
      }
    }

    socket.to(roomId).emit("pauseSong");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`✅ Server running on port ${port}`));
