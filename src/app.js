const joi = require('joi');
const express = require('express');

const logger = require('./logger.js');
const courseRepo = require('./courseRepo.js');

courseRepo.init();
const app = express();

const querySchema = joi.object({
    subject: joi.string().optional(),
    code: joi.string().optional(),
    units: joi.string().optional(),
    isLab: joi.optional(),
});

app.use(logger());

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

app.listen(8000, () => console.log('Server started at port 8000!'));
