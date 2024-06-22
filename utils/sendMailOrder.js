const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  debug: true,
  auth: {
    user: "ibenemeikenna96@gmail.com", // Read email from environment
    pass: "urvf bppa wbgo bmsm", // Read password from environment
  },
});

const sendOrderNotification = async (adminEmails, orderDetails, userEmail) => {
  try {
    // Send notifications to admin emails
    for (const email of adminEmails) {
      await sendEmail(
        email,
        "New Order Placed",
        generateAdminEmailBody(orderDetails)
      );
    }

    // Send notification to user email if provided
    if (userEmail) {
      await sendEmail(
        userEmail,
        "Order Placed Successfully",
        generateUserEmailBody(orderDetails)
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error for handling at a higher level
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    let info = await transporter.sendMail({
      from: '"Clonekraft Team" <ibenemeikenna96@gmail.com>',
      to,
      subject,
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const generateAdminEmailBody = (orderDetails) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
        <style>
            /* Your email styles here */
        </style>
    </head>
    <body>
        <div>
            <p>Dear Admin,</p>
            <p>We are pleased to inform you that a new order has been placed on Clonekraft.</p>
            <p><strong>Order Details:</strong></p>
            <p>Order ID: ${orderDetails.id}</p>
            <p>Customer Name: ${orderDetails.customerName}</p>
            <p>Order Date: ${orderDetails.orderDate}</p>
            <p>Total Amount: ${orderDetails.totalAmount}NGN</p>
            <p>Please log in to the admin dashboard to view more details and manage this order.</p>
            <p>Thank you for your prompt attention to this matter.</p>
            <p>Best regards,<br>Clonekraft Team</p>
        </div>
    </body>
    </html>
  `;
};

const generateUserEmailBody = (orderDetails) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Placed Successfully</title>
        <style>
            /* Your email styles here */
        </style>
    </head>
    <body>
        <div>
            <p>Dear ${orderDetails.customerName},</p>
            <p>Your order on Clonekraft has been placed successfully.</p>
            <p><strong>Order Details:</strong></p>
            <p>Order ID: ${orderDetails.id}</p>
            <p>Order Date: ${orderDetails.orderDate}</p>
            <p>Total Amount: Admin is Setting a Price shortly, you'll get a mail on the cost for your order</p>
            <p>Thank you for using Clonekraft.</p>
            <p>Best regards,<br>Clonekraft Team</p>
        </div>
    </body>
    </html>
  `;
};

module.exports = { sendOrderNotification };
