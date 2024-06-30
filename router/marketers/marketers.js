const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const generateReferralId = require("../../utils/generateReferralId");
const AffiliateMarketer = require("../../models/AffiliateMarketer");
const User = require("../../models/user");
const order = require("../../models/order");
const genAuthTokenAffiliate = require("../../utils/genAuthTokenAffiliate");



// {
//   "email": "affiliate@example.com",
//   "password": "SecurePassword123"
// }

// Affiliate registration route
router.post("/register", async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().min(6).max(200).required(),
    email: Joi.string().min(6).max(30).required().email(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    let marketer = await AffiliateMarketer.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (marketer)
      return res.status(400).send("Affiliate Marketer already exists.");

    let referralId;
    let idExists;

    // Ensure unique referralId
    do {
      referralId = generateReferralId();
      idExists = await AffiliateMarketer.findOne({ referralId });
    } while (idExists);

    marketer = new AffiliateMarketer({
      email: req.body.email.toLowerCase(),
      password: req.body.password,
      referralId: referralId,
    });

    const salt = await bcrypt.genSalt(10);
    marketer.password = await bcrypt.hash(marketer.password, salt);

    await marketer.save();

    const token = genAuthTokenAffiliate(marketer);

    return res.status(200).json({ marketer, token });
  } catch (error) {
    console.error("Error in POST /register:", error.message); // Log the error
    res.status(500).send(`Internal server error: ${error.message}`);
  }
});

// Affiliate login route
router.post("/login", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(30).required().email(),
    password: Joi.string().min(6).max(200).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const marketer = await AffiliateMarketer.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (!marketer) return res.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(
      req.body.password,
      marketer.password
    );
    if (!validPassword)
      return res.status(400).send("Invalid email or password.");

    const token = genAuthTokenAffiliate(marketer);
    return res.status(200).json({ marketer, token });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});
// Get all affiliate marketers with referred users and their order IDs
// Get all affiliate marketers with referred users and their order details
router.get("/", async (req, res) => {
  try {
    // Fetch all affiliate marketers, excluding the password field
    const marketers = await AffiliateMarketer.find().select("-password").lean();

    // Array to store marketers with referred users and their orders info
    const marketersWithUsers = [];

    // Iterate through each marketer
    for (let marketer of marketers) {
      // Find users referred by this marketer
      const referredUsers = await User.find({
        referralId: marketer._id,
      }).select("username email _id");

      // Process each referred user
      const referredUsersWithOrders = await Promise.all(
        referredUsers.map(async (user) => {
          // Fetch orders initiated by the user
          const orders = await order.find({ userId: user._id }).select(
            "_id paid status price progress"
          );

          // Calculate total number of orders made by the user
          const totalOrders = orders.length;

          // Include detailed fields for each order
          const ordersLog = orders.map((order) => ({
            orderId: order._id,
            paid: order.paid,
            status: order.status,
            price: order.price,
            progress: order.progress,
          }));

          return {
            username: user.username,
            email: user.email,
            totalOrders,
            ordersLog, // Include detailed fields
          };
        })
      );

      // Add referredUsers array to marketer object
      marketer.referredUsers = referredUsersWithOrders;
      marketersWithUsers.push({
        ...marketer,
        balance: marketer.balance,
        totalEarnings: marketer.totalEarnings,
        monthlyEarnings: marketer.monthlyEarnings,
        withdrawalLogs: marketer.withdrawalLogs,
        requestWithdrawal: marketer.requestWithdrawal,
      });
    }

    // Return the response with marketers and referred users
    return res.status(200).json(marketersWithUsers);
  } catch (error) {
    console.error("Error in GET /api/affiliates:", error.message);
    return res.status(500).send("Internal server error");
  }
});

router.get("/:referralId", async (req, res) => {
  try {
    const { referralId } = req.params;

    // Fetch the specific affiliate marketer by referralId
    const marketer = await AffiliateMarketer.findOne({ _id: referralId })
      .select("-password")
      .lean();
    if (!marketer) {
      return res.status(404).send("Affiliate Marketer not found.");
    }

    // Find users referred by this marketer
    const referredUsers = await User.find({ referralId: marketer._id }).select(
      "username email _id"
    );

    // Process each referred user
    const referredUsersWithOrders = await Promise.all(
      referredUsers.map(async (user) => {
        // Fetch orders initiated by the user
        const orders = await order.find({ userId: user._id }).select(
          "_id paid status price progress"
        );

        // Calculate total number of orders made by the user
        const totalOrders = orders.length;

        // Include detailed fields for each order
        const ordersLog = orders.map((order) => ({
          orderId: order._id,
          paid: order.paid,
          status: order.status,
          price: order.price,
          progress: order.progress,
        }));

        return {
          username: user.username,
          email: user.email,
          totalOrders,
          ordersLog, // Include detailed fields
        };
      })
    );

    // Add referredUsers array to marketer object
    marketer.referredUsers = referredUsersWithOrders;

    // Return the response with the specific marketer and referred users
    return res.status(200).json({
      ...marketer,
      balance: marketer.balance,
      totalEarnings: marketer.totalEarnings,
      monthlyEarnings: marketer.monthlyEarnings,
      withdrawalLogs: marketer.withdrawalLogs,
      requestWithdrawal: marketer.requestWithdrawal,
    });
  } catch (error) {
    console.error("Error in GET /api/affiliates/:referralId:", error.message);
    return res.status(500).send("Internal server error");
  }
});


// Delete a referral user by ID
router.delete("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and delete the referral user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).send("Referral user not found.");
    }

    return res.status(200).json({ message: "Referral user deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/affiliates/referral-user/:userId:", error.message);
    return res.status(500).send("Internal server error");
  }
});

router.delete("/:marketerId", async (req, res) => {
  try {
    const { marketerId } = req.params;

    // Find and delete the affiliate marketer
    const deletedMarketer = await AffiliateMarketer.findByIdAndDelete(marketerId);

    if (!deletedMarketer) {
      return res.status(404).send("Affiliate marketer not found.");
    }

    return res.status(200).json({ message: "Affiliate marketer deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/affiliates/affiliate-marketer/:marketerId:", error.message);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
