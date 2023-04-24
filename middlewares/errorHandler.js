module.exports = {
  errorWithStatusCode: (message, statusCode) => {
    let error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },
  errorHandler: async (error, req, res, next) => {
    const { message, statusCode } = error;
    return res.status(statusCode).json({ errorMessage: message });
  },
};
