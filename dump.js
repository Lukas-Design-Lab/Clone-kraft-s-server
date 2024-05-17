// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Connect to MongoDB using provided connection string
mongoose.connect(
  "mongodb+srv://ikennaibenemee:maTM2K5bSleR3uJ3@main.rylexnv.mongodb.net/?retryWrites=true&w=majority&appName=Main",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  socketId: String,
});

const User = mongoose.model("User", userSchema);

// Express middleware
app.use(cors());

// Express routes
app.get("/", (req, res) => {
  res.send("Chat App Server is running");
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", async () => {
    console.log("User disconnected");
    try {
      await User.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
    } catch (err) {
      console.error(err);
    }
  });

  // Handle user authentication
  // Handle user authentication
  // Handle user authentication
  // Handle user authentication
  socket.on("authenticate", (email) => {
    User.findOne({ email })
      .exec()
      .then((user) => {
        if (!user) {
          // User not found, create new user
          return User.create({ email, socketId: socket.id });
        } else {
          // User found, update socketId
          user.socketId = socket.id;
          return user.save();
        }
      })
      .then((user) => {
        console.log(`User authenticated: ${email}`);
      })
      .catch((err) => {
        console.error(err);
      });
  });

  // Handle private messages
  // Handle private messages
  socket.on("private_message", async ({ recipientId, message }) => {
    try {
      const recipient = await User.findOne({ _id: recipientId });
      if (recipient && recipient.socketId) {
        io.to(recipient.socketId).emit("private_message", { message });
      } else {
        console.log(`Recipient not found or offline`);
        // Handle offline recipient case
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
