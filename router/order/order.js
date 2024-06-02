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

router.put("/update-price/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newPrice } = req.body;

    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Calculate new balance left
    const amountPaid = order.amountPaid || 0;
    const balanceLeft = newPrice - amountPaid;

    // Update order details
    order.price = newPrice;
    order.totalPrice = newPrice;
    order.balanceLeft = balanceLeft;

    //---------------uncomment to test----------
    // const amountPaid = 0;
    // const balanceLeft = newPrice - amountPaid;

    // // Update order details
    // order.price = newPrice;
    // order.totalPrice = newPrice;
    // order.balanceLeft = balanceLeft;
    // order.amountPaid = amountPaid

    // Log the update
    // order.updatedAt.push({
    //   adminId,
    //   adminUsername,
    // });

    // Save the updated order
    await order.save();

    res.status(200).json({ message: "Price updated successfully", order });
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update order progress endpoint
router.put("/progress/:orderId", adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { progress } = req.body;
    console.log(progress, "progress");
    // Ensure progress is a number and within valid range
    const validatedProgress = progress;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.progress = validatedProgress;

    await order.save();

    res
      .status(200)
      .json({ message: "Order progress updated successfully", order });
  } catch (error) {
    console.error("Error updating order progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/payment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { installment, amountPaid } = req.body; // Expecting `installment` and `amountPaid` from the request body

    console.log(amountPaid, "amountPaid");
    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const newAmount = amountPaid / 1.075;
    console.log(newAmount, "newAmount");
    //order.paid = true;

    if (installment) {
      order.isInstallment = true;

      // Calculate the total amount paid in installments
      const totalInstallmentPaid = order.installments.reduce(
        (total, installment) => total + installment.amountPaid,
        0
      );
      console.log(totalInstallmentPaid, "totalInstallmentPaid");

      if (totalInstallmentPaid < order.totalPrice) {
        if (order.installments.length === 0) {
          // Calculate the 60% initial payment if this is the first installment
          const initialPayment = order.totalPrice * 0.6;
          order.installments.push({
            amountPaid: initialPayment,
            isPaid: true,
            datePaid: new Date(),
            balanceLeft: order.totalPrice - initialPayment,
            selectedLabel: order.selectedLabel,
            description: order.description,
            deliveryOption: order.deliveryOption,
            price: order.price,
            status: order.status,
          });

          order.amountPaid += initialPayment;
          order.balanceLeft = order.totalPrice - initialPayment;
        } else {
          order.installments.push({
            amountPaid: newAmount,
            isPaid: true,
            datePaid: new Date(),
            balanceLeft: order.totalPrice - newAmount,
            selectedLabel: order.selectedLabel,
            description: order.description,
            deliveryOption: order.deliveryOption,
            price: order.price,
            status: order.status,
          });
          order.amountPaid += newAmount;
          order.balanceLeft = order.totalPrice - order.amountPaid;
        }

        // Check if the total price has been fully paid
        if (order.amountPaid >= order.totalPrice) {
          //order.paid = true;
          order.paidAt = new Date();
        }

        // Check if the new amount to be paid plus the balance will make the total installment paid equal to the price
        if (totalInstallmentPaid + newAmount >= order.totalPrice) {
          order.isInstallmentPaid = true;
        }
      } else if (totalInstallmentPaid === order.totalPrice) {
        order.isInstallmentPaid = true;
      }
    } else {
      // Handle full payment
      order.paid = true;
      order.amountPaid = newAmount;
      order.balanceLeft = 0;
      order.paidAt = new Date();
    }

    // Save the updated order
    await order.save();

    // Return the updated order
    res.status(200).json({ message: "Payment processed successfully", order });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/cross/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Set the "paid" field to true
    order.paid = false;

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
      const {
        _id,
        username,
        email,
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
    const orders = await Order.find().sort({ createdAt: -1 });
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
    const orders = await Order.find().sort({ createdAt: -1 });
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
