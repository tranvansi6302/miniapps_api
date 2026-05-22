const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");

const generateAccessToken = (payload) => {
  return jwt.sign(payload, authConfig.accessSecret, {
    expiresIn: authConfig.accessExpiresIn
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshExpiresIn
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, authConfig.accessSecret);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, authConfig.refreshSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
