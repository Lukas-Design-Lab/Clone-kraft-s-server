const jwt = require("jsonwebtoken");
const jwtSecretKey = "ibenemeCloneKraft";

const genAdmin = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.adminEmail, // Using adminEmail instead of email
      username: user.username,
      admin: user?.admin,
    },
    jwtSecretKey
  );
  console.log(token, "token");
  return token;
};

module.exports = genAdmin;
