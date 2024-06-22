const express = require("express");
const router = express.Router();
const B2 = require("backblaze-b2");
const multer = require("multer");
const Order = require("../../models/order");
const authMiddleware = require("../../middleware/token/headerToken");
const adminMiddleware = require("../../middleware/token/adminToken");
const { sendOrderNotification } = require("../../utils/sendMailOrder");
const User = require("../../models/user");
const { sendSMS } = require("../smsRouter");
const {
  constructStatusUpdateEmail,
  constructPriceUpdateEmail,
  sendEmail,
  sendProgressUpdateNotification,
} = require("../../utils/sendUpdateEmails");
const parseNumber = (value) => {
  if (typeof value === "string") {
    return parseFloat(value.replace(/,/g, ""));
  }
  return value;
};

const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Function to format phone number
const formatPhoneNumber = (phoneNumber) => {
  // Remove leading zero and add +234
  if (phoneNumber.startsWith("0")) {
    return "+234" + phoneNumber.slice(1);
  }
  return phoneNumber;
};

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// router.post(
//   "/create",
//   authMiddleware,
//   authMiddleware,
//   upload.array("images"),
//   async (req, res) => {
//     try {
//       const {
//         _id,
//         username,
//         email,
//         // imageUrl, address, phoneNumber
//       } = req.user; // Assuming the authMiddleware adds user information to req.user
//       const {
//         selectedLabel,
//         description,
//         deliveryOption,
//         // seaters,
//         // shape,
//         // styleOfChair,
//         // choice,
//         // price,
//       } = req.body;
//       const uploadedImageURLs = [];
//       for (const file of req.files) {
//         const fileName = `orders/images/${Date.now()}_${file.originalname.replace(
//           /\s+/g,
//           "_"
//         )}`;
//         await b2.authorize(); // Authorize with Backblaze B2
//         const response = await b2.getUploadUrl({
//           bucketId: "ce38bb235c0071f288f70619",
//         });
//         const uploadResponse = await b2.uploadFile({
//           uploadUrl: response.data.uploadUrl,
//           uploadAuthToken: response.data.authorizationToken,
//           fileName: fileName,
//           data: file.buffer,
//         });
//         const bucketName = "Clonekraft";
//         const uploadedFileName = uploadResponse.data.fileName;
//         const imageURL = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
//         uploadedImageURLs.push(imageURL);
//       }

//       const order = await Order.create({
//         userId: _id,
//         username: username,
//         email: email,
//         //address: address ? address : null,
//         //phoneNumber: phoneNumber ? phoneNumber : null,

//         selectedLabel,
//         selectedImages: uploadedImageURLs,
//         description,
//         deliveryOption,
//         paid: false,
//         price: null,
//       });
//       const adminEmails = [
//         "Gbolahanifeoluwa10@gmail.com",
//         "9jacarpenter@gmail.com",
//         "ibenemeikenna96@gmail.com",
//       ];

//       const orderDetails = {
//         id: order._id,
//         customerName: username,
//         orderDate: new Date(order.createdAt).toLocaleDateString(),
//         totalAmount: "Pending",
//       };
//       await sendOrderNotification(adminEmails, orderDetails);
//       res.status(201).json({ message: "Order created successfully", order });
//     } catch (error) {
//       console.error("Error creating order:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

router.post(
  "/create",
  authMiddleware,
  upload.array("images"),
  async (req, res) => {
    try {
      const { _id } = req.user; // Assuming the authMiddleware adds user ID to req.user

      // Find the user by ID
      const user = await User.findById(_id).select(
        "username email address phoneNumber"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { username, email, address, phoneNumber } = user;
      const { selectedLabel, description, deliveryOption } = req.body;

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
        address: address || null,
        phoneNumber: phoneNumber || null,
        selectedLabel,
        selectedImages: uploadedImageURLs,
        description,
        deliveryOption,
        paid: false,
        price: null,
      });

      const adminEmails = [
        "Gbolahanifeoluwa10@gmail.com",
        "9jacarpenter@gmail.com",
        "ibenemeikenna96@gmail.com",
      ];

      const orderDetails = {
        id: order._id,
        customerName: username,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        totalAmount: "Pending",
      };
      await sendOrderNotification(adminEmails, orderDetails, email);

      // Format the phone number before sending SMS
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      if (formattedPhoneNumber) {
        const message = `Hello ${username}, your order on Clonekraft has been placed successfully. We will notify you shortly once the price is calculated by the admin.`;
        sendSMS(formattedPhoneNumber, message)
          .then(() => {
            console.log(`SMS sent successfully to ${formattedPhoneNumber}`);
          })
          .catch((error) => {
            console.error(
              `Failed to send SMS to ${formattedPhoneNumber}:`,
              error
            );
          });
      }

      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by its ID and delete it
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully", order: deletedOrder });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/", async (req, res) => {
  try {
    // Delete all documents from the Order collection
    const deletedOrders = await Order.deleteMany({});

    res.json({
      message: "All orders deleted successfully",
      deletedCount: deletedOrders.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

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

    // Ensure progress is a number and within valid range
    const validatedProgress = progress;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.progress = validatedProgress;

    await order.save();

    // Fetch user details (assuming you have User model and order has userId)
    const user = await User.findById(order.userId).select(
      "username email phoneNumber"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { username, email, phoneNumber } = user;

    // Format the phone number before sending SMS
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // Send SMS and email to user for progress update
    const message = `Dear ${username}, the progress for your Clonekraft  order (${order._id}) has been updated to ${progress}%.`;
    sendSMS(formattedPhoneNumber, message)
      .then(() => {
        console.log(`SMS sent successfully to ${formattedPhoneNumber}`);
      })
      .catch((error) => {
        console.error(`Failed to send SMS to ${formattedPhoneNumber}:`, error);
      });

    sendProgressUpdateNotification(email, username, order._id, progress); // Send email to user

    res
      .status(200)
      .json({ message: "Order progress updated successfully", order });
  } catch (error) {
    console.error("Error updating order progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/single/:id", async (req, res) => {
  try {
    console.log(req.params.id, "req.params.id");
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).send("Server Error");
  }
});

router.put("/rate/:orderId", adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rate } = req.body;
    console.log(rate, "progress");
    // Ensure progress is a number and within valid range
    //const validatedProgress = progress;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.rated = true;

    await order.save();

    res.status(200).json({ message: "Order rated successfully", order });
  } catch (error) {
    console.error("Error rating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/payment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    let { installment, amountPaid } = req.body; // Expecting `installment` and `amountPaid` from the request body

    // Parse amountPaid to ensure it's a number
    amountPaid = parseNumber(amountPaid);

    if (isNaN(amountPaid)) {
      return res.status(400).json({ error: "Invalid amountPaid value" });
    }

    console.log(amountPaid, "amountPaid");

    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const newAmount = amountPaid;
    console.log(newAmount, "newAmount");

    if (installment) {
      order.isInstallment = true;

      // Calculate the total amount paid in installments
      const totalInstallmentPaid = order.installments.reduce(
        (total, installment) => total + installment.amountPaid,
        0
      );

      if (order.price > totalInstallmentPaid) {
        if (order.installments.length === 0) {
          console.log(totalInstallmentPaid, "totalInstallmentPaid");

          // Calculate the 60% initial payment if this is the first installment
          const initialPayment = order.price * 0.6;
          order.installments.push({
            amountPaid: initialPayment,
            isPaid: true,
            datePaid: new Date(),
            balanceLeft: order.price - initialPayment,
            selectedLabel: order.selectedLabel,
            description: order.description,
            deliveryOption: order.deliveryOption,
            price: order.price,
            status: order.status,
          });

          order.amountPaid = initialPayment; // Set the initial payment
          order.balanceLeft = order.price - initialPayment;
        } else {
          console.log(totalInstallmentPaid, "elsee");

          const balanceLeft = order.price - (totalInstallmentPaid + newAmount);
          order.installments.push({
            amountPaid: newAmount,
            isPaid: true,
            datePaid: new Date(),
            balanceLeft: balanceLeft,
            selectedLabel: order.selectedLabel,
            description: order.description,
            deliveryOption: order.deliveryOption,
            price: order.price,
            status: order.status,
          });

          order.amountPaid += newAmount;
          order.balanceLeft = balanceLeft;
          order.status = "in Progress";
        }

        // Check if the total price has been fully paid
        if (order.amountPaid >= order.price) {
          order.paid = true;
          order.paidAt = new Date();
          order.status = "in Progress";
        }

        // Check if the new amount to be paid plus the balance will make the total installment paid equal to the price
        if (totalInstallmentPaid + newAmount >= order.price) {
          order.isInstallmentPaid = true;
          order.status = "in Progress";
        }
      } else if (totalInstallmentPaid === order.price) {
        order.isInstallmentPaid = true;
        order.status = "in Progress";
      }
    } else {
      // Handle full payment
      order.paid = true;
      order.amountPaid = newAmount;
      order.balanceLeft = 0;
      order.paidAt = new Date();
      order.status = "in Progress";
    }

    // Save the updated order
    await order.save();

    // Return the updated order, making sure to include the installments array
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

router.put(
  "/update-progress/:orderId",
  upload.array("images"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      console.log(orderId, "orderId");
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

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.progressImages.push(...uploadedImageURLs);
      await order.save();

      res
        .status(200)
        .json({ message: "Progress images updated successfully", order });
    } catch (error) {
      console.error("Error updating progress images:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
router.post("/request-delivery", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.requestDelivery = true;
    await order.save();

    res.status(200).json({ message: "Delivery requested successfully", order });
  } catch (error) {
    console.error("Error requesting delivery:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to confirm delivery
router.post("/confirm-delivery", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.confirmDelivery = true;
    await order.save();

    res.status(200).json({ message: "Delivery confirmed successfully", order });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to mark as delivered
router.post("/mark-delivered", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDelivered = true;
    await order.save();

    res
      .status(200)
      .json({ message: "Order marked as delivered successfully", order });
  } catch (error) {
    console.error("Error marking order as delivered:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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
    const { status, price, paid } = req.body;

    const updateObject = {};
    if (status) {
      if (
        ["completed", "cancelled", "pending", "in Progress"].includes(status)
      ) {
        updateObject.status = status;
      } else {
        return res.status(400).json({ error: "Invalid status" });
      }
    }
    if (price !== undefined) {
      // Validate price to ensure it's a number
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: "Invalid price format" });
      }
      updateObject.price = parsedPrice;

      // Send price update notification and update order
      // (your existing code for sending notifications and updating order)
    }
    if (paid !== undefined) {
      updateObject.paid = paid;
    }

    const order = await Order.findByIdAndUpdate(orderId, updateObject, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send status update notification
    if (status) {
      const user = await User.findById(order.userId).select(
        "username email phoneNumber"
      );
      if (user) {
        const { username, email, phoneNumber } = user;
        const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

        const message = `Dear ${username}, the status for your order on Clonekraft with ID (${order._id}) has been updated to ${status}.`;
        sendSMS(formattedPhoneNumber, message)
          .then(() => {
            console.log(`SMS sent successfully to ${formattedPhoneNumber}`);
          })
          .catch((error) => {
            console.error(
              `Failed to send SMS to ${formattedPhoneNumber}:`,
              error
            );
          });

        const statusUpdateEmail = constructStatusUpdateEmail(
          email,
          username,
          order._id,
          status
        );
        await sendEmail(statusUpdateEmail);
      }
      const adminEmails = [
        "Gbolahanifeoluwa10@gmail.com",
        "9jacarpenter@gmail.com",
        "ibenemeikenna96@gmail.com",
      ];
      // Send email to admin
      adminEmails.forEach(async (adminEmail) => {
        const adminStatusUpdateEmail = constructStatusUpdateEmail(
          adminEmail,
          "Admin",
          order._id,
          status
        );
        await sendEmail(adminStatusUpdateEmail);
      });
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

//--------------------- set messages to read -----------------
router.put("/messages/:orderId/:messageId/read", async (req, res) => {
  try {
    const { orderId, messageId } = req.params;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, "messages._id": messageId },
      { $set: { "messages.$.isRead": true } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order or message not found" });
    }

    res.status(200).json({ message: "Message marked as read", order });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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
    const reversedOrders = orders.reverse();
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
