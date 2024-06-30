const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateMarketer',
      default: null
    },
    orders: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        messages: [
          {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            isRead: {
              type: Boolean,
              default: false,
            },
            timeSent: {
              type: Date,
              default: Date.now,
            },
            username: {
              type: String,
              required: true,
              minlength: 3,
              maxlength: 30,
            },
            userId: {
              type: String,
              required: true,
              minlength: 3,
              maxlength: 30,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
