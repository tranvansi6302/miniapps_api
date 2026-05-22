const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    ok: true,
    message,
    data
  });
};

const error = (res, message = "Internal Server Error", errorDetails = null, statusCode = 500) => {
  const response = {
    ok: false,
    message
  };
  if (errorDetails) {
    response.error = errorDetails;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  error
};
