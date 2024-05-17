const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../../models/admin");
const genAdmin = require("../../utils/genAdmin");
const adminMiddleware = require("../../middleware/token/adminToken");
// Route to update admin password

router.put("/update", async (req, res) => {
  try {
    const { adminEmail, currentPassword, newPassword, userType } = req.body;

    // Find the admin by email
    const admin = await Admin.findOne({ adminEmail });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.userType = userType;
    await admin.save();

    res.status(200).json({ message: "Admin password updated successfully" });
  } catch (error) {
    console.error("Error updating admin password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    // Find all admins in the database
    const admins = await Admin.find();

    // If no admins found, send a 404 response
    if (!admins || admins.length === 0) {
      return res.status(404).json({ message: "No admins found" });
    }

    // If admins found, send the admins as response
    res.status(200).json({ success: true, admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
});

router.get("/profiler", adminMiddleware, async (req, res) => {
  try {
    // Extract admin email from request headers
    const adminEmail = req.user.email;
    console.log(adminEmail, 'adminEmail')

    // Fetch admin profile from the database
    const adminProfile = await Admin.findOne({ adminEmail });

    if (!adminProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Admin profile not found" });
    }

    // Return admin profile as response
    res.status(200).json({ success: true, adminProfile });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin profile" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    // Delete all admin accounts
    await Admin.deleteMany({});

    res
      .status(200)
      .json({ message: "All admin accounts deleted successfully" });
  } catch (error) {
    console.error("Error deleting all admin accounts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { adminEmail, password, fullname, username } = req.body;

    // Check if the admin email already exists
    const existingAdmin = await Admin.findOne({ adminEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin email already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin
    const admin = await Admin.create({
      adminEmail,
      password: hashedPassword,
      username,
      fullname,
    });
    res
      .status(201)
      .json({ message: "Admin account created successfully", admin });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { adminEmail, password } = req.body;

    // Check if the admin exists
    const admin = await Admin.findOne({ adminEmail });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = genAdmin(admin);

    // Return token and admin object
    res.header("auth-token", token).json({ token, admin });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
