const { formatService } = require('./services');

exports.containsWord = (source, word) => {
    return source.match(new RegExp(`\\b${word}\\b`, 'u')) !== null;
}

exports.error = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

exports.validate = (schema, data) => {
    const { value, error } = schema.validate(data);
    if (error) {
        throw exports.error(error.details[0].message, 400);
    }
    return value;
}

exports.formatHandlerWrapper = (handler, options = {}) => {
    const wrapperLogic = (req, res, next, handlerData) => {
        const { data, formatOptions = {} } = handlerData;
        const acceptHeader = req.header('accept');
        const baseFormatOptions = {
            format: acceptHeader,
            ...formatOptions,
        };
        try {
            const {
                formattedData,
                contentType,
            } = formatService.format(data, baseFormatOptions);
            res.setHeader('Content-Type', contentType);
            return res.send(formattedData);
        } catch (error) {
            return next(error);
        }
    }
    if (!options.errorHandler) {
        return (req, res, next) => {
            const handlerData = handler(req, res);
            wrapperLogic(req, res, next, handlerData);
        };
    }
    return (error, req, res, next) => {
        const handlerData = handler(error, req, res, next);
        wrapperLogic(req, res, next, handlerData);
    };
}
