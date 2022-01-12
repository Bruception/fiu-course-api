const _ = require('lodash');
const express = require('express');
const statusRouter = require('./status');
const coursesRouter = require('./courses');

const routerMap = {
    '/courses': coursesRouter,
    '/status': statusRouter,
};

const addApiRoutes = (app) => {
    const apiRouter = express.Router();
    _.each(routerMap, (router, path) => {
        apiRouter.use(path, router);
    });
    app.use('/api', apiRouter);
}

module.exports = addApiRoutes;
