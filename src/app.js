const joi = require('joi');
const express = require('express');
const app = express();
const path = require('path');

const { logger, errorHandler } = require('./middleware');
const courseDataStore = require('./courseDataStore')();
const formatService = require('./formatService');

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
    const formattedData = formatService.format(results, req.query.format);
    return res.status(200).send(formattedData);
});

app.get('*', (_req, res) => {
    res.status(302).redirect('/index.html');
});

app.use(errorHandler);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}!`)
});

module.exports = {
    app,
    server,
};
