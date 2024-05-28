const mongoose = require("mongoose");

const UpdateLogSchema = new mongoose.Schema({
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", // Assuming you have an Admin model
    required: true,
  },
  adminUsername: {
    type: String,
    required: true,
  },
});

const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  timeSent: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
  },
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  selectedLabel: {
    type: String,
    required: true,
  },
  selectedImages: [
    {
      type: String, // Assuming you are storing image URLs
      required: true,
    },
  ],
  description: {
    type: String,
  },
  deliveryOption: {
    type: Number,
  },
  price: {
    type: String,
  },
  paid: {
    type: Boolean,
  },
  status: {
    type: String,
    default: "pending",
  },
  seaters: {
    type: String,
  },
  shape: {
    type: String,
  },
  styleOfChair: {
    type: String,
  },
  choice: {
    type: String,
  },
  totalPrice: {
    type: Number,
  },
  messages: [MessageSchema], // Array for storing messages
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: [UpdateLogSchema], // Array for logging updates
});

module.exports = mongoose.model("Order", OrderSchema);
