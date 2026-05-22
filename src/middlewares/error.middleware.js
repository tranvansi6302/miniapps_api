const responseHelper = require("../utils/response.helper");

const errorHandler = (err, req, res, next) => {
  console.error("🔴 Server Error:", err.stack);
  return responseHelper.error(res, "An unexpected server error occurred", err.message, 500);
};

module.exports = {
  errorHandler
};
