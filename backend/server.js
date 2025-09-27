import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {};
let typingUsers = {};

io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

  // User joins with name
  socket.on("join", (name) => {
    onlineUsers[socket.id] = name;
    io.emit("onlineUsers", Object.keys(onlineUsers).length);
    io.emit("message", {
      role: "system",
      content: `${name} joined the chat`,
      time: new Date(),
    });
  });

// NEW: Handle leave explicitly (tab closed)
  socket.on("leave", (name) => {
    // find socketId of this user
    const socketId = Object.keys(onlineUsers).find(
      (id) => onlineUsers[id] === name
    );

    if (socketId) {
      delete onlineUsers[socketId];
      delete typingUsers[socketId];
      io.emit("onlineUsers", Object.keys(onlineUsers).length);
      io.emit("userTyping", Object.values(typingUsers));

      io.emit("message", {
        role: "system",
        content: `${name} left the chat`,
        time: new Date(),
      });
    }
  });

  // Receive chat message
  socket.on("sendMessage", (msg) => {
    io.emit("message", {
      role: "user",
      content: msg.content,
      time: new Date(),
      name: msg.name,
    });
    delete typingUsers[socket.id];
    io.emit("userTyping", Object.values(typingUsers));
  });

  socket.on("typing", (name) => {
    typingUsers[socket.id] = name;
    io.emit("userTyping", Object.values(typingUsers));

    // remove after 3s of inactivity
    setTimeout(() => {
      delete typingUsers[socket.id];
      io.emit("userTyping", Object.values(typingUsers));
    }, 3000);
  });

  

  // Handle disconnect
  socket.on("disconnect", () => {
    // const name = onlineUsers[socket.id];
    // delete onlineUsers[socket.id];
    delete typingUsers[socket.id];


    // io.emit("onlineUsers", Object.keys(onlineUsers).length);
    io.emit("userTyping", Object.values(typingUsers));

    // if (name) {
    //   io.emit("message", {
    //     role: "system",
    //     content: `${name} left the chat`,
    //     time: new Date(),
    //   });
    // }
    // console.log("User disconnected", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

