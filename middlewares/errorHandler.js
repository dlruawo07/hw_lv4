module.exports = {
  errorWithStatusCode: (statusCode, message) => {
    let error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
  errorHandler: async (err, req, res, next) => {
    const { message, statusCode } = err;
    console.error(err);
    return res.status(statusCode).json({ errorMessage: message });
  },
};
