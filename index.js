const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const auth = require("./router/auth/auth");
const orders = require("./router/order/order");
//const User = require("./models/user");
// const Message = require("./models/messages");
const bodyParser = require("body-parser");
const admin = require("./router/admin/admin");
const Order = require("./models/order");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const dbURI =
  "mongodb+srv://ikennaibenemee:ikennaibenemee@cluster0.vheofmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    startServer();
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use("/auth", auth);
app.use("/order", orders);
app.use("/admin", admin);
// Map to keep track of which users are typing in each room
//const typingUsers = new Map();

io.on("connection", async (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", async (groupUniqueID, userId) => {
    socket.join(groupUniqueID);
    console.log(`User ${userId} joined room ${groupUniqueID}`);

    // Send a welcome message when a user joins the room
    //io.to(groupUniqueID).emit("message", "Welcome to the chat room!");
  });

  socket.on(
    "messages",
    async (groupUniqueID, { userId, username, message }) => {
      try {
        // Find the order by groupId
        const orders = await Order.findOne({ _id: groupUniqueID });

        if (!orders) {
          console.log("Orders not found for group ID:", groupUniqueID);
          return;
        }

        // Push the new message to the messages array of the orders
        orders.messages.push({
          message: message,
          username: username,
          userId: userId,
          timeSent: new Date(),
          isRead: false,
        });

        // Save the updated orders
        await orders.save();

        console.log("Message saved to orders:", orders);

        // Emit the message to all users in the room
        io.to(groupUniqueID).emit("message", {
          message: message,
          username: username,
          userId: userId,
          timeSent: new Date(),
        });
      } catch (error) {
        console.error("Error saving message to orders:", error);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});


const PORT = process.env.PORT || 3000;

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
