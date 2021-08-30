const formatService = require('./formatService');

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
    const wrapperLogic = (req, res, handlerData) => {
        const { data, formatOptions = {} } = handlerData
        const baseFormatOptions = {
            format: req.query.format || req.body.format,
            ...formatOptions,
        };
        const {
            formattedData,
            contentType,
        } = formatService.format(data, baseFormatOptions);
        res.setHeader('Content-Type', contentType);
        res.send(formattedData);
    }
    if (!options.errorHandler) {
        return (req, res) => {
            const handlerData = handler(req, res);
            wrapperLogic(req, res, handlerData);
        };
    }
    return (error, req, res, next) => {
        const handlerData = handler(error, req, res, next);
        wrapperLogic(req, res, handlerData);
    };
}
