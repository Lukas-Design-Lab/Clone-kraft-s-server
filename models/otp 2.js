const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, expires: 180, default: Date.now } // Expires in 3 minutes
});

const OTPModel = mongoose.model('OTP', OTPSchema);

module.exports = OTPModel;
