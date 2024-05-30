const express = require("express");
const router = express.Router();
const B2 = require("backblaze-b2");
const multer = require("multer");
const Order = require("../../models/order");
const authMiddleware = require("../../middleware/token/headerToken");
const adminMiddleware = require("../../middleware/token/adminToken");

const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.put("/cross/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Set the "paid" field to true
    order.paid = true;

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "Order marked as paid successfully" });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/create",
  authMiddleware,
  authMiddleware,
  upload.array("images"),
  async (req, res) => {
    try {
      const { _id, username, email, 
       // imageUrl, address, phoneNumber 
      } = req.user; // Assuming the authMiddleware adds user information to req.user
      const {
        selectedLabel,
        description,
        deliveryOption,
        // seaters,
        // shape,
        // styleOfChair,
        // choice,
        // price,
      } = req.body;
      const uploadedImageURLs = [];
      for (const file of req.files) {
        const fileName = `orders/images/${Date.now()}_${file.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        await b2.authorize(); // Authorize with Backblaze B2
        const response = await b2.getUploadUrl({
          bucketId: "ce38bb235c0071f288f70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: file.buffer,
        });
        const bucketName = "Clonekraft";
        const uploadedFileName = uploadResponse.data.fileName;
        const imageURL = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
        uploadedImageURLs.push(imageURL);
      }

      const order = await Order.create({
        userId: _id,
        username: username,
        email: email,
        //address: address ? address : null,
        //phoneNumber: phoneNumber ? phoneNumber : null,

        selectedLabel,
        selectedImages: uploadedImageURLs,
        description,
        deliveryOption,
        //imageUrl ? imageUrl : null,
        paid: false,
        price: null,
        // styleOfChair: styleOfChair,
        // seaters: seaters,
        // shape: shape,
        // choice: choice,
        // price: price,
      });

      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/messages/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Return the messages for the order
    res.status(200).json({ messages: order.messages });
  } catch (error) {
    console.error("Error fetching messages for order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:orderId", adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, price, paid } = req.body; // Destructure status, price, and paid from req.body

    // Construct update object based on provided fields
    const updateObject = {};
    if (status) {
      if (["completed", "cancelled", "pending"].includes(status)) {
        // Check if status is valid
        updateObject.status = status;
      } else {
        return res.status(400).json({ error: "Invalid status" }); // Return error for invalid status
      }
    }
    if (price) updateObject.price = price;
    if (paid !== undefined) updateObject.paid = paid; // Check for undefined to allow setting paid to false

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateObject, // Use updateObject in findByIdAndUpdate
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/admin", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get orders for a specific user
router.get("/user/old", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const userOrders = await Order.find({ user: userId });
    res.status(200).json(userOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users", authMiddleware, async (req, res) => {
  try {
    // Extract userId from request headers
    const userId = req.user._id;

    const orders = await Order.find({ userId });

    // Reverse the array of orders
    const reversedOrders = orders.reverse();

    // Return reversed orders as response
    res.status(200).json({ success: true, orders: reversedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});
router.delete("/", async (req, res) => {
  try {
    // Delete all orders from the database
    await Order.deleteMany({});

    res.status(200).json({ message: "All orders deleted successfully" });
  } catch (error) {
    console.error("Error deleting orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/read/:orderId/", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update isRead field of all messages to true
    order.messages.forEach((message) => {
      message.isRead = true;
    });

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "All messages marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
