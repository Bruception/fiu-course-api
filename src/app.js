const joi = require('joi');
const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore.js')();
const formatService = require('./formatService.js');

app.use('/', express.static(path.resolve(__dirname, './public')));
app.use(logger());

const stringQuerySchema = joi.alternatives().try(
    joi.string().optional(),
    joi.array().items(joi.string()),
);

const querySchema = joi.object({
    subject: stringQuerySchema,
    code: stringQuerySchema,
    units: stringQuerySchema,
    isLab: joi.optional(),
    format: joi.string()
        .valid(...formatService.SUPPORTED_FORMATS)
        .insensitive()
        .optional(),
});

app.get('/api', (req, res, next) => {
    const { value, error } = querySchema.validate(req.query);
    if (error) {
        const invalidError = new Error(error.details[0].message);
        invalidError.statusCode = 400;
        return next(invalidError);
    }
    const results = courseDataStore.queryBy(value);
    const { formattedData, contentType } = formatService.format(results, req.query.format);
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
