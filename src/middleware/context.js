const { v4: uuidv4 } = require('uuid');

const getContextMiddleware = () => {
    let requestsReceived = 0;
    return (req, _res, next) => {
        requestsReceived += 1;
        req.context = {
            requestId: uuidv4(),
            requestNumber: requestsReceived,
        };
        next();
    }
}

module.exports = getContextMiddleware;
