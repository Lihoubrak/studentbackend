const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

let users = [];

const addUser = (userId, socketId) => {
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId });
    console.log("User added:", userId);
  }
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  console.log("User removed:", socketId);
};

const getReceiverSocketId = (receiverId) => {
  const user = users.find((user) => user.userId === receiverId);
  return user ? user.socketId : null;
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("userList", users);
    console.log("Updated user list sent to clients:", users);
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    removeUser(socket.id);
    io.emit("userList", users);
    console.log("Updated user list after disconnection:", users);
  });
});

module.exports = { app, io, server, getReceiverSocketId };
