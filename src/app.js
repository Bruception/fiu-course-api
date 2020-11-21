const joi = require('joi');
const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore.js')();

app.use(logger());
app.use('/', express.static(path.resolve(__dirname, './public')))

const stringQuerySchema = joi.alternatives().try(
    joi.string().optional(),
    joi.array().items(joi.string()),
);

const querySchema = joi.object({
    subject: stringQuerySchema,
    code: stringQuerySchema,
    units: stringQuerySchema,
    isLab: joi.optional(),
});

app.get('/api', (req, res) => {
    const { value, error } = querySchema.validate(req.query);
    const results = error ? [] : courseDataStore.queryBy(value);
    const statusCode = error ? 400 : 200;
    return res.status(statusCode).json({
        total: results.length,
        results,
        ...(error && { error: error.details[0].message }),
    });
});

app.get('*', (_req, res) => {
    res.status(302).redirect('/index.html');
});

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => console.log(`Server started at port ${PORT}!`));

module.exports = {
    app,
    server,
}
