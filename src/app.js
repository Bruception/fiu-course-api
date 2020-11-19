const joi = require('joi');
const app = require('express')();

const logger = require('./logger.js')();
const courseRepo = require('./courseRepo.js')();

app.use(logger);

const querySchema = joi.object({
    subject: joi.string().optional(),
    code: joi.string().optional(),
    units: joi.string().optional(),
    isLab: joi.optional(),
});

app.get('/api', (req, res) => {
    const { value, error } = querySchema.validate(req.query);
    const results = error ? [] : courseRepo.queryBy(value);
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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server started at port ${PORT}!`));
