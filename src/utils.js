exports.containsWord = (source, word) => {
    return source.match(new RegExp(`\\b${word}\\b`, 'u')) !== null;
}

exports.error = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

exports.omit = (object, keys) => {
    const keysSet = new Set(keys);
    return Object.fromEntries(Object.entries(object).filter(([key]) => {
        return !keysSet.has(key);
    }));
}

exports.validate = (schema, data) => {
    const { value, error } = schema.validate(data);
    if (error) {
        throw exports.error(error.details[0].message, 400);
    }
    return value;
}
