const jwtSecretKey = "ibenemeCloneKraft";

const jwt = require("jsonwebtoken");

const genAuthToken = (user) => {
  const secretKey = "jwtSecretKey";

  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email? user.email: user.adminEmail,
      address: user?.address,
      phoneNumber: user?.phoneNumber,
      username: user?.username,
      imageUrl: user?.imageUrl,
      userType: user?.userType,
    },
    secretKey
  );
  console.log(token, "token");
  return token;
};

module.exports = genAuthToken;
