const jwt = require("jsonwebtoken");

function genAuthTokenAffiliate(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    referralId: user.referralId,
  };
  const token = jwt.sign(payload, "your_jwt_private_key");
  return token;
}

module.exports = genAuthTokenAffiliate;
