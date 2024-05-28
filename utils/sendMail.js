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

const sendOTP = async (email, otp) => {
  try {
    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Ikenna Ibeneme" <ibenemeikenna96@gmail.com>', // Sender address
      to: email, // List of recipients
      subject: "Your OTP for Verification", // Subject line
      text: `Dear User,

Thank you for registering with Clonekraft. We are excited to have you on board. Clonekraft is your ultimate destination for uploading images of furniture you admire, estimating the cost to replicate them, making payments, and getting your custom furniture crafted and delivered to you.

To proceed with the verification of your account, please use the One-Time Password (OTP) provided below:

Your OTP for verification is: ${otp}

Please enter this OTP on the Clonekraft website to complete your registration process. This code is valid for the next 15 minutes.

Thank you for choosing Clonekraft. We look forward to helping you bring your furniture inspirations to life.

Best regards,
Clonekraft Team`, // Plain text body
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Email</title>
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
              .otp-text {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333333;
                  text-align: center;
              }
              .otp-number {
                  font-size: 36px;
                  font-weight: bold;
                  color: #ffaa00;
                  margin-top: 10px;
                  text-align: center;
              }
              .description {
                  font-size: 16px;
                  color: #333333;
                  margin-top: 20px;
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
                  <h2>Welcome to Clonekraft!</h2>
              </div>
              <div class="description">
                  <p>Dear User,</p>
                  <p>Thank you for registering with Clonekraft. We are excited to have you on board. Clonekraft is your ultimate destination for uploading images of furniture you admire, estimating the cost to replicate them, making payments, and getting your custom furniture crafted and delivered to you.</p>
                  <p>To proceed with the verification of your account, please use the One-Time Password (OTP) provided below:</p>
              </div>
              <div class="otp-text">
                  Your OTP for verification is:
              </div>
              <div class="otp-number">
                  ${otp}
              </div>
              <div class="description">
                  <p>Please enter this OTP on the Clonekraft website to complete your registration process. This code is valid for the next 15 minutes.</p>
                  <p>Thank you for choosing Clonekraft. We look forward to helping you bring your furniture inspirations to life.</p>
              </div>
              <div class="footer">
                  Best regards,<br>
                  Clonekraft Team
              </div>
          </div>
      </body>
      </html>`, // HTML body
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log("Error sending email:", error);
    return error; // Rethrow the error for handling at a higher level
  }
};

module.exports = { sendOTP };
