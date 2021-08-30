const { formatHandlerWrapper } = require('../utils');

const DEFAULT_ERROR_MESSAGE = 'Oops! Something went wrong.'
const BAD_REQUEST_STATUS_CODE = 400;
const DEFAULT_ERROR_STATUS_CODE = 500;

module.exports = formatHandlerWrapper(
    (error, _req, res, _next) => {
        console.error(error.stack, '\n');
        const errorStatusCode = error.statusCode || DEFAULT_ERROR_STATUS_CODE;
        const errorMessage = error.message || DEFAULT_ERROR_MESSAGE;
        res.status(errorStatusCode);
        return {
            data: {
                error: (errorStatusCode === BAD_REQUEST_STATUS_CODE) ? errorMessage : DEFAULT_ERROR_MESSAGE,
            },
        }
    },
    {
        errorHandler: true,
    }
);
