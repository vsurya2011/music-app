import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve everything from /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Room page → room.html
app.get("/room/:roomId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

// Store current song & time per room
const rooms = {}; // { roomId: { song, time } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Send current state to new user
    if (rooms[roomId]) {
      socket.emit("playSong", rooms[roomId]);
    }
  });

  socket.on("playSong", (data) => {
    const { roomId, song, time } = data;
    rooms[roomId] = { song, time }; // Save room state
    socket.to(roomId).emit("playSong", { song, time });
  });

  socket.on("pauseSong", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("pauseSong");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`✅ Server running on port ${port}`));
