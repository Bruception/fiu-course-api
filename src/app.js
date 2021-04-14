const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore');
const formatService = require('./formatService');

app.use('/', express.static(path.resolve(__dirname, './public')));
app.use(logger());

app.get('/api', (req, res) => {
    const { query } = req;
    const results = courseDataStore.queryBy(query);
    const { formattedData, contentType } = formatService.format(results, query.format);
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
