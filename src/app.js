const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore');
const formatService = require('./formatService');
const { version } = require('../package.json');

const APP_START_TIME = new Date().getTime();

app.use(logger());
app.use(express.json());
app.disable('x-powered-by');
app.use('/', express.static(path.resolve(__dirname, './public')));

app.get('/api', (req, res) => {
    const { query, body } = req;
    const results = courseDataStore.queryBy([query, body]);
    const {
        formattedData,
        contentType,
    } = formatService.format(results, {
        format: query.format,
        ...courseDataStore.formatOptions,
    });
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(formattedData);
});

app.get('/status', (req, res) => {
    const currentTime = new Date().getTime();
    const statusData = {
        version,
        status: 'ok',
        uptime: currentTime - APP_START_TIME,
    };
    const formatOptions = {
        format: req.query.format,
    };
    const {
        formattedData,
        contentType
    } = formatService.format(statusData, formatOptions);
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(formattedData);
});

app.get('/favicon.ico', (_req, res) => {
    return res.sendStatus(204);
});

app.get('*', (_req, res) => {
    return res.status(302).redirect('/');
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
