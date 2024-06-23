const axios = require("axios");

const TERMII_API_KEY = "TLfDidZA8O75gO1yxmwQfvIQZ5RFmVOegdKBZwlQ5Cxg6coTdZC4NiZ1U1IqAJ";
const TERMII_API_URL = "https://api.ng.termii.com/api/sms/send";

const sendSMS = async (to, message) => {
  try {
    const response = await axios.post(TERMII_API_URL, {
      to,
      sms: message,
      type: "plain", // or 'flash' depending on your needs
      channel: "generic",
      api_key: TERMII_API_KEY,
      from: "ChatWazobia",
    });
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending SMS:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to send SMS");
  }
};

module.exports = {
  sendSMS,
};
