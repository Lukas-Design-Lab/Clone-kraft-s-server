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

const sendWelcomeEmail = async (email) => {
  try {
    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Clonekraft Team" <process.env.EMAIL_USER>', // Sender address
      to: email, // List of recipients
      subject: "Welcome to Clonekraft!", // Subject line
      text: `Dear User,

Thank you for registering with Clonekraft. We are excited to have you on board. Clonekraft is your ultimate destination for uploading images of furniture you admire, estimating the cost to replicate them, making payments, and getting your custom furniture crafted and delivered to you.

Visit us anytime by clicking the link below:
https://www.lukasreflectionworks.com/

Thank you for choosing Clonekraft. We look forward to helping you bring your furniture inspirations to life.

Best regards,
Clonekraft Team`, // Plain text body
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Clonekraft!</title>
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
              .description {
                  font-size: 16px;
                  color: #333333;
                  margin-top: 20px;
              }
              .cta {
                  display: block;
                  width: 100%;
                  text-align: center;
                  margin: 20px 0;
              }
              .cta a {
                  font-size: 18px;
                  font-weight: bold;
                  color: #ffffff;
                  background-color: #ffaa00;
                  padding: 10px 20px;
                  text-decoration: none;
                  border-radius: 5px;
              }
              .cta a:hover {
                  background-color: #ff8800;
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
                  <p>Visit us anytime by clicking the link below:</p>
              </div>
              <div class="cta">
                  <a href="https://www.lukasreflectionworks.com/">Visit Clonekraft</a>
              </div>
              <div class="description">
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

module.exports = { sendWelcomeEmail };
