const joi = require('joi');
const yaml = require('yaml');
const utils = require('./utils');
const xml2js = require('xml2js');

const SUPPORTED_FORMATS = ['json', 'text', 'xml', 'yaml'];

const OPTIONS_SCHEMA = joi.object({
    format: joi.string()
        .valid(...SUPPORTED_FORMATS)
        .insensitive()
        .optional(),
    shapeFunction: joi.function()
        .arity(1)
        .optional(),
});

const FORMAT_MIME_TYPES = {
    'json': 'application/json',
    'xml': 'application/xml',
};

const DEFAULT_OPTIONS = {
    format: 'json',
    shapeFunction: (data) => data,
}

const XML_BUILDER = new xml2js.Builder();

const textFormatter = (data) => {
    if (Array.isArray(data)) {
        return `\n${data.map((entry) => {
            return `${textFormatter(entry)}`
        }).join('\n')}`;
    }
    if (typeof data !== 'object') {
        return data;
    }
    return Object.keys(data).map((key) => {
        return `${key}: ${textFormatter(data[key])}`
    }).join('\n');
}

const formatters = {
    'json': JSON.stringify,
    'text': textFormatter,
    'xml': (data) => {
        return XML_BUILDER.buildObject(data);
    },
    'yaml': yaml.stringify,
};

module.exports = {
    format(data, options = DEFAULT_OPTIONS) {
        const validatedOptions = utils.validate(OPTIONS_SCHEMA, options);
        const {
            format = DEFAULT_OPTIONS.format,
            shapeFunction = DEFAULT_OPTIONS.shapeFunction,
        } = validatedOptions;
        const targetType = format.toLowerCase();
        const targetFormatter = formatters[targetType];
        return {
            formattedData: targetFormatter(shapeFunction(data)),
            contentType: FORMAT_MIME_TYPES[targetType] || 'text/plain',
        }
    },
};
