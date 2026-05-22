const { verifyAccessToken } = require("../utils/jwt.helper");
const responseHelper = require("../utils/response.helper");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return responseHelper.error(res, "Access token is required", null, 401);
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return responseHelper.error(res, "Invalid or expired access token", null, 403);
  }

  req.user = decoded; // Lưu thông tin user giải mã được vào request
  next();
};

module.exports = {
  authenticateToken
};
