require("dotenv").config();
const express = require("express");
const httpServer = require("http");
const socketio = require("socket.io");
const cors = require("cors")
const PORT = process.env.PORT;
const app = express();
app.use(cors({ origin: 'https://www.seniormanagers.com' }));
const server = httpServer.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === "development"? `http://localhost:3000`:process.env.BASE_URL,
  },
});

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'http://your-frontend-domain.com');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
//   });


// listening events

// io.on("connection", (socket) => {
//   console.log(`we have new connection`);
//   // console.log(socket);
//   socket.on("online", (userId) => {
//     // defined limit
//     addUser({ socketId: socket.id, userId });
//     console.log(users);
//   });
//   socket.on("disconnect", () => {
//     // predefined event "disconnect"
//     removeUser(socket.id);
//     console.log(users);
//     // console.log(socket.id);
//   });
// });
let chatRoom = ""; // E.g. javascript, node,...
let allUsers = [];
io.on("connection", (socket) => {
    console.log(`User connected ${socket.id}`);
    // Add a user to a room
    socket.on("join_room", (data) => {
      const { room } = data; // Data sent from client when join_room event emitted
      socket.join(room); // Join the user to a socket room

      // Save the new user to the room
      chatRoom = room;
      allUsers.push({ id: socket.id, room });
      const chatRoomUsers = allUsers.filter((user) => user.room === room);
      socket.to(room).emit("chatroom_users", chatRoomUsers);
      socket.emit("chatroom_users", chatRoomUsers);
    });

    socket.on("send_message", (data) => {
      const { room,  } = data;
      io.in(room).emit("receive_message", data); // Send to all users in room, including sender
    });

    socket.on("leave_room", (data) => {
      const { room } = data;
      socket.leave(room);
      // Remove user from memory
      allUsers = leaveRoom(socket.id, allUsers);
      socket.to(room).emit("chatroom_users", allUsers);
  
      console.log(`${room} has left the chat`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from the chat");
      const user = allUsers.find((user) => user.id == socket.id);
      if (user?.username) {
        allUsers = leaveRoom(socket.id, allUsers);
        socket.to(chatRoom).emit("chatroom_users", allUsers);
        socket.to(chatRoom).emit("receive_message", {
          message: `user has disconnected from the chat.`,
        });
      }
    });
  });

server.listen(PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});