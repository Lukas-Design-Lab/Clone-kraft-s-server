const mongoose = require("mongoose");

const UpdateLogSchema = new mongoose.Schema({
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
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

const InstallmentSchema = new mongoose.Schema({
  amountPaid: {
    type: Number,
    required: true,
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  datePaid: {
    type: Date,
    default: Date.now,
  },
  balanceLeft: {
    type: Number,
  },
  selectedLabel: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  deliveryOption: {
    type: Number,
  },
  price: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: "pending",
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
  },
  imageUrl: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  selectedLabel: {
    type: String,
    required: true,
  },
  selectedImages: [
    {
      type: String,
      required: true,
    },
  ],
  progressImages: [
    {
      type: String,
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
    type: Number,
    default: 0,
  },
  requestDelivery: {
    type: Boolean,
    default: false,
  },
  confirmDelivery: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,
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
  rated: {
    type: Boolean,
    default: false,
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: [UpdateLogSchema],
  paidAt: {
    type: Date,
  },
  amountPaid: {
    type: Number,
  },
  balanceLeft: {
    type: Number,
  },
  isInstallment: {
    type: Boolean,
    default: false,
  },
  isInstallmentPaid: {
    type: Boolean,
    default: false,
  },
  installments: [InstallmentSchema],
  progress: {
    type: Number,
    default: 0, // Progress in percentage
  },
});

module.exports = mongoose.model("Order", OrderSchema);
