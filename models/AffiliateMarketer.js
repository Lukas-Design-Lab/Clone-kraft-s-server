const mongoose = require("mongoose");

const WithdrawalLogSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  report: {
    type: String,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

const ReferredUserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
    // unique: true, // Remove this line to eliminate the unique constraint
  },
  password: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  monthlyEarnings: {
    type: Number,
    default: 0,
  },
  withdrawalLogs: [WithdrawalLogSchema],
  requestWithdrawal: {
    type: Boolean,
    default: false,
  },
});

const AffiliateMarketerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    referralId: {
      type: String,
      unique: true,
      required: true,
    },
    referredUsers: [ReferredUserSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AffiliateMarketer", AffiliateMarketerSchema);
