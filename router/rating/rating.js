const express = require("express");
const router = express.Router();
const Rating = require("../../models/rating");
const authMiddleware = require("../../middleware/token/headerToken");
const Order = require("../../models/order");
router.post("/rate", authMiddleware, async (req, res) => {
  const { rating, review, orderId, orderDescription, orderPrice } = req.body;
  try {
    // Extract reviewer's email from the token
    const reviewerEmail = req.user.email; // Assuming 'email' is the field containing the email in the token

    const newRating = new Rating({
      reviewerEmail, // Changed from 'reviewer' to 'reviewerEmail'
      rating,

      review,
      orderId,
      orderDescription,
      orderPrice,
    });
    await newRating.save();

    // Find the order by orderId and update its 'rated' status to true
    await Order.findOneAndUpdate({ _id: orderId }, { rated: true });

    res
      .status(201)
      .json({ message: "Rating submitted successfully", rating: newRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Edit a rating
router.put("/ratings/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;
  try {
    const updatedRating = await Rating.findByIdAndUpdate(
      id,
      { rating, review },
      { new: true, runValidators: true }
    );
    if (!updatedRating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    res
      .status(200)
      .json({ message: "Rating updated successfully", rating: updatedRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all ratings
router.get("/ratings", async (req, res) => {
  try {
    const ratings = await Rating.find().populate(
      { path: "reviewerEmail", select: "email" } // Populate the reviewerEmail field with email
    );
    res.status(200).json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all ratings
router.get("/ratings", authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({
      reviewerEmail: req.user.email,
    }).populate(
      { path: "reviewerEmail", select: "email" } // Populate the reviewerEmail field with email
    );
    res.status(200).json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a rating by order ID
router.get("/ratings/order/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  try {
    const rating = await Rating.findOne({ orderId }).populate(
      { path: "reviewerEmail", select: "email" } // Populate the reviewerEmail field with email
    );
    if (!rating) {
      return res
        .status(404)
        .json({ message: "Rating not found for this order" });
    }
    res.status(200).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Optional: Delete a rating (if needed)
router.delete("/ratings/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await Rating.findByIdAndDelete(id);
    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
