const express = require('express');
const { formatHandlerWrapper } = require('../utils');
const { statusService } = require('../services');

const statusRouter = express.Router();

statusRouter.get('/', formatHandlerWrapper(
    (req) => {
        const statusData = statusService.getStatus(req.context);
        return {
            data: statusData,
            formatOptions: statusService.formatOptions
        };
    }
));

module.exports = statusRouter;
