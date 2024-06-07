// routes/subscriptionRoutes.js
const express = require("express");
const Subscription = require("../../models/subscription");
const router = express.Router();
//const Subscription = require("../models/Subscription");

// Subscribe a user
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  console.log(email, 'emailemail')
  try {
    const newSubscription = new Subscription({ email });
    await newSubscription.save();
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate email
      res.status(400).json({ message: "Email already subscribed" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// Get all subscribed users
router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Subscription.find();
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a user from the newsletter
router.delete("/unsubscribe/:email", async (req, res) => {
  const { email } = req.params;
  try {
    await Subscription.findOneAndDelete({ email: email.toLowerCase() });
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
