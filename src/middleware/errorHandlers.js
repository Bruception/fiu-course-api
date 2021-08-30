const servicePB = require('../protos/service_pb');
const { formatHandlerWrapper } = require('../utils');

const DEFAULT_ERROR_MESSAGE = 'Oops! Something went wrong.'
const BAD_REQUEST_STATUS_CODE = 400;
const DEFAULT_ERROR_STATUS_CODE = 500;

const baseErrorLogic = (error, res) => {
    console.error(error, '\n');
    const errorStatusCode = error.statusCode || DEFAULT_ERROR_STATUS_CODE;
    const errorMessage = error.message || DEFAULT_ERROR_MESSAGE;
    res.status(errorStatusCode);
    return {
        error: (errorStatusCode === BAD_REQUEST_STATUS_CODE)
        ? errorMessage
        : DEFAULT_ERROR_MESSAGE,
    };
}

exports.fallbackErrorHandler = (error, _req, res, _next) => {
    const errorData = baseErrorLogic(error, res);
    res.json(errorData);
}

exports.formattedErrorHandler = formatHandlerWrapper(
    (error, _req, res, _next) => {
        const errorData = baseErrorLogic(error, res);
        return {
            data: errorData,
            formatOptions: {
                getProtocolBuffer: (data) => {
                    const errorProto = new servicePB.Error();
                    errorProto.setError(data.error);
                    return errorProto;
                },
            },
        }
    },
    {
        errorHandler: true,
    }
);
