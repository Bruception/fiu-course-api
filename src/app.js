const path = require('path');
const helmet = require('helmet');
const express = require('express');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore');
const { version } = require('../package.json');
const { formatHandlerWrapper } = require('./utils');

const APP_START_TIME = new Date().getTime();
const PUBLIC_PATH = path.resolve(__dirname, './public');

const app = express();

app.use(helmet());
app.use(logger());
app.use(express.json());
app.use('/', express.static(PUBLIC_PATH));

let requestsFulfilled = 0;

app.get('/api', formatHandlerWrapper(
    (req) => {
        const { query, body } = req;
        const results = courseDataStore.queryBy([query, body]);
        requestsFulfilled += 1;
        return {
            data: results,
            formatOptions: courseDataStore.formatOptions,
        };
    }
));

app.get('/status', formatHandlerWrapper(
    () => {
        const currentTime = new Date().getTime();
        const statusData = {
            version,
            uptime: currentTime - APP_START_TIME,
            dataAsOf: courseDataStore.dataAsOf,
            requestsFulfilled,
        };
        return { data: statusData };
    }
));

app.get('/favicon.ico', (_req, res) => {
    return res.status(204).end();
});

app.get('*', (_req, res) => {
    return res.redirect('/');
});

app.use(errorHandler);

/* istanbul ignore next */
const PORT = process.env.PORT || 8000;
/* istanbul ignore next */
const server = app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}!`)
});

module.exports = {
    app,
    server,
};
