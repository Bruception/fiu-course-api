const express = require('express');
const { courseDataService } = require('../services');
const { formatHandlerWrapper } = require('../utils');

const coursesRouter = express.Router();

coursesRouter.get('/', formatHandlerWrapper(
    (req) => {
        const { query, body } = req;
        const results = courseDataService.queryBy([query, body]);
        return {
            data: results,
            formatOptions: courseDataService.formatOptions,
        };
    }
));

module.exports = coursesRouter;
