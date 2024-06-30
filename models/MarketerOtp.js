const mongoose = require("mongoose");

const MarketerOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL (Time-To-Live) in seconds, 300 seconds = 5 minutes
  },
});

const MarketerOtp = mongoose.model("MarketerOtp", MarketerOtpSchema);

module.exports = MarketerOtp;
