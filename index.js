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
const newsletter = require("./router/newsletter/news");
const rating = require("./router/rating/rating");
//const order = require("./models/order");
//const paystackRoutes = require("./router/pay");
const app = express();
//const smsRouter = require("./router/smsRouter");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const parseNumber = (value) => {
  if (typeof value === "string") {
    return parseFloat(value?.replace(/,/g, ""));
  }
  return value;
};
const dbURI =
  "mongodb+srv://ikennaibenemee:ikennaibenemee@cluster0.vheofmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const updateOrders = async () => {
  try {
    const orders = await Order.find({});

    const updatePromises = orders.map((order) => {
      const balanceLeft = order.totalPrice - (order.amountPaid || 0);

      return Order.updateOne(
        { _id: order._id },
        {
          $set: {
            isInstallmentPaid: false,
            isInstallment: false,
            installments: [],
            amountPaid: 0,
            balanceLeft: 0,
          },
        }
      );
    });

    await Promise.all(updatePromises);
    console.log("Orders updated successfully");
  } catch (error) {
    console.error("Error updating orders:", error);
  }
};

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    startServer();
    //updateOrders();
    //updateOrder();
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// const updateOrder = async () => {
//   try {
//     // Fetch all orders
//     const orders = await Order.find({});

//     // Iterate over each order and update the numeric fields
//     for (const order of orders) {
//       // Update the price field
//       order.price = parseNumber(order.price);

//       // Update the amountPaid field to ensure it's a valid number
//       order.amountPaid = parseNumber(order.amountPaid);

//       // Update the installments to ensure each amountPaid is a valid number
//       order.installments = order.installments.map((installment) => {
//         installment.amountPaid = parseNumber(installment.amountPaid);
//         return installment;
//       });

//       // Save the updated order
//       await order.save();
//     }

//     console.log("All orders have been updated successfully.");
//     mongoose.connection.close();
//   } catch (error) {
//     console.error("Error updating orders:", error);
//     mongoose.connection.close();
//   }
// };

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use("/auth", auth);
app.use("/order", orders);
app.use("/admin", admin);
app.use("/newsletter", newsletter);
app.use("/rating", rating);
//app.use("/messaging", smsRouter);
//app.use("/api/paystack", paystackRoutes); // Use the Paystack router

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

const PORT = process.env.PORT || 3003;

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
