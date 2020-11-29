const DEFAULT_ERROR_MESSAGE = 'Oops! Something went wrong.'
const DEFAULT_ERROR_STATUS_CODE = 500;

module.exports = (error, _req, res, _next) => {
    console.log(error.stack);
    res.status(error.statusCode || DEFAULT_ERROR_STATUS_CODE).json({
        error: error.message || DEFAULT_ERROR_MESSAGE,
    });
};
