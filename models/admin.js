const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
    unique: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
  },
  fullname: {
    type: String,
    unique: true,
  },
  userType: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("Admin", AdminSchema);
