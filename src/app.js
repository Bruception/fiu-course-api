const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore');
const { version } = require('../package.json');
const { formatHandlerWrapper } = require('./utils');

const APP_START_TIME = new Date().getTime();

app.use(logger());
app.use(express.json());
app.disable('x-powered-by');
app.use('/', express.static(path.resolve(__dirname, './public')));

app.get('/api', formatHandlerWrapper(
    (req) => {
        const { query, body } = req;
        const results = courseDataStore.queryBy([query, body]);
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
            status: 'ok',
            uptime: currentTime - APP_START_TIME,
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
