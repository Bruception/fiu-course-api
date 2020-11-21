const joi = require('joi');
const app = require('express')();

const logger = require('./logger.js')();
const courseDataStore = require('./courseDataStore.js')();

app.use(logger);

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
    res.status(200).send('TODO: API Documentation.');
});

app.use((error, _req, res, _next) => {
    console.log(error.stack);
    res.status(500).json({
        error: 'Oops something went wrong!',
    });
});

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => console.log(`Server started at port ${PORT}!`));

module.exports = {
    app,
    server,
}
