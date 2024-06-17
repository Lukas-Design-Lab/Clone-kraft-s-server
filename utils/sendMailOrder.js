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

const sendOrderNotification = async (adminEmails, orderDetails) => {
  try {
    for (const email of adminEmails) {
      // Send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Clonekraft Team" <ibenemeikenna96@gmail.com>', // Sender address
        to: email, // Recipient
        subject: "New Order Placed", // Subject line
        text: `Dear Admin,

We are pleased to inform you that a new order has been placed on Clonekraft.

Order Details:
Order ID: ${orderDetails.id}
Customer Name: ${orderDetails.customerName}
Order Date: ${orderDetails.orderDate}
Total Amount: ${orderDetails.totalAmount}

Please log in to the admin dashboard to view more details and manage this order.

Thank you for your prompt attention to this matter.

Best regards,
Clonekraft Team`, // Plain text body
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Notification</title>
            <style>
                body {
                    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header h2 {
                    color: #808080;
                }
                .order-details {
                    font-size: 16px;
                    color: #333333;
                    margin-top: 20px;
                }
                .order-details p {
                    margin: 5px 0;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 14px;
                    color: #808080;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Order Notification</h2>
                </div>
                <div class="order-details">
                    <p>Dear Admin,</p>
                    <p>We are pleased to inform you that a new order has been placed on Clonekraft.</p>
                    <p><strong>Order Details:</strong></p>
                    <p>Order ID: ${orderDetails.id}</p>
                    <p>Customer Name: ${orderDetails.customerName}</p>
                    <p>Order Date: ${orderDetails.orderDate}</p>
                    <p>Total Amount: ${orderDetails.totalAmount}</p>
                    <p>Please log in to the admin dashboard to view more details and manage this order.</p>
                </div>
                <div class="footer">
                    Thank you for your prompt attention to this matter.<br>
                    Best regards,<br>
                    Clonekraft Team
                </div>
            </div>
        </body>
        </html>`, // HTML body
      });

      console.log("Message sent: %s", info.messageId);
    }
  } catch (error) {
    console.log("Error sending email:", error);
    return error; // Rethrow the error for handling at a higher level
  }
};

module.exports = { sendOrderNotification };
