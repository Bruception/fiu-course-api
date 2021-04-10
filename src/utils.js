exports.containsWord = (source, word) => {
    return source.match(new RegExp(`\\b${word}\\b`, 'u')) !== null;
}

exports.error = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

exports.omit = (object, keys) => {
    return Object.fromEntries(Object.entries(object).filter(([key]) => {
        return !keys.includes(key);
    }));
}
