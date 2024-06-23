const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "ibenemeikenna96@gmail.com",
    pass: "urvf bppa wbgo bmsm",
  },
});

// Function to construct status update email template
const constructStatusUpdateEmail = (recipient, recipientName, orderId, status) => {
  return {
    from: '"Clonekraft Team"',
    to: recipient,
    subject: `Order Status Update: Order ${orderId}`,
    html: `
      <p>Dear ${recipientName},</p>
      <p>The status for your order (${orderId}) has been updated to <strong>${status}</strong>.</p>
      <p>Thank you for using our services.</p>
      <p>Best regards,</p>
      <p>Clonekraft Team</p>
    `,
  };
};

// Function to construct price update email template
const constructPriceUpdateEmail = (recipient, recipientName, orderId, price) => {
  return {
    from: '"Clonekraft Team"',
    to: recipient,
    subject: `Price Update: Order ${orderId}`,
    html: `
      <p>Dear ${recipientName},</p>
      <p>The price for your order (${orderId}) has been updated to <strong>${price}</strong>.</p>
      <p>Please proceed to make payment.</p>
      <p>Thank you for using our services.</p>
      <p>Best regards,</p>
      <p>Clonekraft Team</p>
    `,
  };
};

// Function to send email
const sendEmail = async (mailOptions) => {
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendProgressUpdateNotification = async (recipient, username, orderId, progress) => {
    try {
      // Send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Clonekraft Team"',
        to: recipient,
        subject: `Order Progress Update for Order ${orderId}`,
        html: `
          <p>Dear ${username},</p>
          <p>The progress for your order (${orderId}) has been updated to ${progress}%.</p>
          <p>Thank you for choosing Clonekraft.</p>
        `,
      });
  
      console.log("Progress update notification sent:", info.messageId);
    } catch (error) {
      console.error("Error sending progress update notification:", error);
      throw new Error("Failed to send progress update notification");
    }
  };

module.exports = {
  constructStatusUpdateEmail,
  constructPriceUpdateEmail,
  sendEmail,
  sendProgressUpdateNotification
};
