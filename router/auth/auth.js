const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const genAuthToken = require("../../utils/genAuthToken");
const Joi = require("joi");
const User = require("../../models/user");
const OTPModel = require("../../models/otp");
const { sendOTP } = require("../../utils/sendMail");
const authMiddleware = require("../../middleware/token/headerToken");
const B2 = require("backblaze-b2");
const multer = require("multer");
const adminMiddleware = require("../../middleware/token/adminToken");

// const User = require("../models/user");
// const OTPModel = require("../models/otp");
// const { sendOTP } = require("../utils/sendMail");
router.post("/update", async (req, res) => {
  const { username, email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Update user profile
    user.username = username;
    await user.save();

    res.status(200).send("User profile updated successfully.");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.post("/change-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).send("Invalid old password.");
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send("Password changed successfully.");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.post("/resend", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the OTP database
    let otpData = await OTPModel.findOne({ email });

    // If no OTP data found, create new OTP entry
    if (!otpData) {
      // Generate a new OTP
      const otp = Math.random().toString().slice(2, 8); // Generate a 6-digit OTP

      // Save the new OTP to the database
      otpData = await OTPModel.create({ email, otp });
      console.log(email, "email");
      // Send the new OTP to the user's email
      await sendOTP(email, otp);

      return res.send("New OTP has been sent to your email.");
    }

    // Generate a new OTP
    const otp = Math.random().toString().slice(2, 8); // Generate a 6-digit OTP

    // Update the existing OTP in the database with the new one
    otpData.otp = otp;
    await otpData.save();

    // Send the new OTP to the user's email
    await sendOTP(email, otp);

    res.send("New OTP has been sent to your email.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

router.post("/register", async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().min(6).max(200).required(),
    email: Joi.string().min(6).max(30).required(),
    username: Joi.string().min(3).max(30).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (user) return res.status(400).send("User already exists.");

  user = new User({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email.toLowerCase(),
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  try {
    // Generate OTP
    const otp = Math.random().toString().slice(2, 8); // Generate a 6-digit OTP

    // Save OTP to database
    await OTPModel.create({ email: user.email, otp });

    // Send OTP to user's email
    await sendOTP(user.email, otp);

    // Save user to the database
    await user.save();

    res.send("OTP sent to your email for verification.");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.post("/validate", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find OTP in database
    const otpData = await OTPModel.findOne({ email, otp });
    if (!otpData) {
      return res.status(400).send("Invalid OTP");
    }

    // Delete OTP from database
    await OTPModel.deleteOne({ email, otp });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found.");
    }

    // Generate authentication token
    const token = genAuthToken(user);

    // Return user object and token
    res.status(200).send({ user, token });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.post("/login", async (req, res) => {
  console.log(req.body.email.toLowerCase(), req.body.password.toLowerCase());
  const schema = Joi.object({
    email: Joi.string().min(3).max(200).required().email(),
    password: Joi.string().min(6).max(200).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  console.log(error, "err");
  let user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) return res.status(400).send("Invalid email or password");

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(400).send("Invalid email or password");

  // Remove password field from user object
  const { password, ...userWithoutPassword } = user.toObject();

  // Send token and user information (without password) in response
  const token = genAuthToken(user);
  return res.status(200).send({ token, user: userWithoutPassword });
});

router.post("/forgot", async (req, res) => {
  const { email } = req.body;

  // Check if email exists in the database
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send("Email not found.");
  }

  // Generate OTP
  const otp = Math.random().toString().slice(2, 8); // Generate a 6-digit OTP

  // Save OTP to database
  await OTPModel.create({ email, otp });

  // Send OTP to email (you'll need to implement this part using a mail service)
  await sendOTP(email.toLowerCase(), otp);

  res.send("OTP has been sent to your email.");
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  // Find OTP in database
  const otpData = await OTPModel.findOne({ email, otp });
  if (!otpData) {
    return res.status(400).send("Invalid OTP");
  }

  // Delete OTP from database
  await OTPModel.deleteOne({ email, otp });

  res.send("OTP verified successfully.");
});

router.post("/reset", async (req, res) => {
  const { email, newPassword } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send("User not found.");
  }

  // Update password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  await user.save();

  res.send("Password reset successfully.");
});

router.delete("/delete", async (req, res) => {
  try {
    // Delete all users from the database
    await User.deleteMany();

    res.status(200).send("All users deleted successfully.");
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.get("/users", adminMiddleware, async (req, res) => {
  try {
    console.log(req.user.userType, "eq.user.userType");
    // Check if the user is an admin
    if (req.user.userType !== "admin") {
      return res
        .status(403)
        .send("Access forbidden. Admin privileges required.");
    }
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  // Since the authMiddleware has already verified and decoded the token, you can access the decoded user information from req.user
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).send("User not found.");

    // Return the user profile without the password
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, address, phoneNumber } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Update user fields
    if (username) {
      user.username = username;
    }
    if (address) {
      user.address = address;
    }
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }

    // Save the updated user
    await user.save();

    // Return the updated user
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send("Internal Server Error.");
  }
});

const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.put(
  "/image",
  upload.single("image"),
  authMiddleware,
  async (req, res) => {
    try {
      const { _id } = req.user;
      console.log(req.file, "pppp");
      // Check if file is uploaded
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Extract file data
      const fileBuffer = req.file.buffer;
      const fileName = `users/images/${Date.now()}_${req.file.originalname.replace(
        /\s+/g,
        "_"
      )}`;

      // Authorize with Backblaze B2
      await b2.authorize();

      // Get upload URL from B2
      const response = await b2.getUploadUrl({
        bucketId: "ce38bb235c0071f288f70619", // Bucket ID to upload the file to
      });

      const uploadResponse = await b2.uploadFile({
        uploadUrl: response.data.uploadUrl,
        uploadAuthToken: response.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
      });

      // Construct image URL from uploaded file information
      const bucketName = "Clonekraft"; // Name of the bucket
      const uploadedFileName = uploadResponse.data.fileName;
      const imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

      // Update user's image URL
      await User.findByIdAndUpdate(_id, { $set: { imageUrl: imageUrl } });

      res
        .status(200)
        .json({ message: "User image updated successfully", imageUrl });
    } catch (error) {
      console.error("Error updating user image:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
