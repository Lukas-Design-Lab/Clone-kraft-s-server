const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const generateReferralId = require("../../utils/generateReferralId");
const AffiliateMarketer = require("../../models/AffiliateMarketer");
const User = require("../../models/user");
const order = require("../../models/order");
const genAuthTokenAffiliate = require("../../utils/genAuthTokenAffiliate");
const MarketerOtp = require("../../models/MarketerOtp");
const nodemailer = require("nodemailer");
const { resendOTP } = require("../../utils/resendOtp");
// {
//   "email": "affiliate@example.com",
//   "password": "SecurePassword123"
// }

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to initiate forgot password process
router.post("/forgot", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    // Check if marketer exists
    let marketer = await AffiliateMarketer.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (!marketer) return res.status(404).send("Marketer not found.");

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to temporary schema (MarketerOtp)
    await MarketerOtp.findOneAndDelete({ email: req.body.email });
    const newOtp = new MarketerOtp({
      email: req.body.email,
      otp,
      createdAt: new Date(),
    });
    await newOtp.save();
    const email = req.body.email;
    console.log(otp, "otp");
    resendOTP(email, otp);
    return res.status(200).send("OTP sent to your email.");
  } catch (error) {
    console.error("Error in forgot password:", error.message);
    return res.status(500).send("Internal server error.");
  }
});

// Route to validate OTP and reset password
router.post("/validate", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).max(200).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    // Find OTP in temporary schema (MarketerOtp)
    const otpRecord = await MarketerOtp.findOne({
      email: req.body.email,
      otp: req.body.otp,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // OTP valid for 5 minutes
    });

    if (!otpRecord) return res.status(400).send("Invalid OTP or expired.");

    // Update password for the marketer
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    await AffiliateMarketer.findOneAndUpdate(
      { email: req.body.email },
      { $set: { password: hashedPassword } }
    );

    // Delete OTP record from temporary schema
    await MarketerOtp.deleteOne({ email: req.body.email });

    return res.status(200).send("Password updated successfully.");
  } catch (error) {
    console.error("Error in validate OTP:", error.message);
    return res.status(500).send("Internal server error.");
  }
});
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
      username: req.body.email.toLowerCase(),
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

    console.log(marketer, "marketer");
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
// Get all affiliate marketers with referred users
router.get("/marketers", async (req, res) => {
  try {
    // Fetch all affiliate marketers, excluding the password field
    const marketers = await AffiliateMarketer.find().select("-password").lean();

    // Array to store marketers with referred users
    const marketersWithUsers = [];

    // Iterate through each marketer
    for (let marketer of marketers) {
      // Find users referred by this marketer
      const referredUsers = await User.find({
        referralId: marketer._id,
      }).select("username email _id");

      // Add referredUsers array to marketer object
      marketer.referredUsers = referredUsers.map((user) => ({
        username: user.username,
        email: user.email,
        userId: user._id,
      }));
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
    console.error("Error in GET /api/affiliates/marketers:", error.message);
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
        const orders = await order
          .find({ userId: user._id })
          .select("_id paid status price progress");

        // Calculate total number of orders made by the user
        const totalOrders = orders.length;

        // Include detailed fields for each order
        const ordersLog = orders.map((order) => ({
          orderId: order._id,
          paid: order.paid,
          status: order.status,
          price: order.price,
          progress: order.progress,
          totalOrders: totalOrders,
          username: user.username,
          email: user.email,
          balance: marketer.balance,
          totalEarnings: marketer.totalEarnings,
          monthlyEarnings: marketer.monthlyEarnings,
          withdrawalLogs: marketer.withdrawalLogs,
          requestWithdrawal: marketer.requestWithdrawal,
        }));

        return {
          ordersLog, // Include detailed fields
        };
      })
    );

    // Add referredUsers array to marketer object
    marketer.referredUsers = referredUsersWithOrders;

    // Return the response with the specific marketer and referred users
    return res.status(200).json({
      ...marketer,
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

    return res
      .status(200)
      .json({ message: "Referral user deleted successfully." });
  } catch (error) {
    console.error(
      "Error in DELETE /api/affiliates/referral-user/:userId:",
      error.message
    );
    return res.status(500).send("Internal server error");
  }
});

router.delete("/:marketerId", async (req, res) => {
  try {
    const { marketerId } = req.params;

    // Find and delete the affiliate marketer
    const deletedMarketer = await AffiliateMarketer.findByIdAndDelete(
      marketerId
    );

    if (!deletedMarketer) {
      return res.status(404).send("Affiliate marketer not found.");
    }

    return res
      .status(200)
      .json({ message: "Affiliate marketer deleted successfully." });
  } catch (error) {
    console.error(
      "Error in DELETE /api/affiliates/affiliate-marketer/:marketerId:",
      error.message
    );
    return res.status(500).send("Internal server error");
  }
});

// Get users by referral ID
router.get("/users/:referralId", async (req, res) => {
  const { referralId } = req.params;
  try {
    // Find users referred by the specified referral ID
    const users = await User.find({ referralId }).select("username email _id");
    console.log(users, "users");
    // Aggregate total orders and total paid orders for each user
    const usersWithOrderInfo = await Promise.all(
      users.map(async (user) => {
        // Get the total order count for the user
        const totalOrders = await order.countDocuments({ userId: user._id });

        // Get the count of paid orders for the user
        const paidOrders = await order.countDocuments({
          userId: user._id,
          status: "paid",
        });

        return {
          username: user.username,
          email: user.email,
          totalOrders,
          paidOrders,
    
        };
      })
    );

    // Return the response with the users and their order information
    return res.status(200).json(usersWithOrderInfo);
  } catch (error) {
    console.error(
      `Error in GET /api/affiliates/users/${referralId}:`,
      error.message
    );
    return res.status(500).send("Internal server error");
  }
});

// Get orders of users by referral ID
router.get("/orders/:referralId", async (req, res) => {
  const { referralId } = req.params;
  try {
    // Find users referred by the specified referral ID
    const users = await User.find({ referralId }).select("username email _id");

    // Create a map of user IDs to user data for quick lookup
    const userMap = users.reduce((map, user) => {
      map[user._id] = { username: user.username, email: user.email };
      return map;
    }, {});

    // Collect user IDs
    const userIds = users.map((user) => user._id);

    // Find orders for the collected user IDs
    const orders = await order.find({ userId: { $in: userIds } }).select("_id paid status price progress userId");

    // Enrich orders with user information
    const ordersWithUserInfo = orders.map(order => ({
      ...order.toObject(),
      username: userMap[order.userId].username,
      email: userMap[order.userId].email,
    }));

    // Return the response with the orders and user information
    return res.status(200).json(ordersWithUserInfo);
  } catch (error) {
    console.error(
      `Error in GET /api/affiliates/orders/${referralId}:`,
      error.message
    );
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
