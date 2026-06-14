require("dotenv").config();

module.exports = {
  accessSecret: process.env.ACCESS_TOKEN_SECRET || "miniapps_access_secret_token_key_123456",
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || "miniapps_refresh_secret_token_key_789012",
  accessExpiresIn: "1d",
  refreshExpiresIn: "30d"
};
