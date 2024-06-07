const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
  reviewerEmail: { type: String, required: true },
  rating: { type: Number },
  Suggestion: { type: String },
  review: { type: String },
  orderId: { type: String, required: true },
  orderDescription: { type: String },
  orderPrice: { type: Number },
});

module.exports = mongoose.model("Rating", ratingSchema);
