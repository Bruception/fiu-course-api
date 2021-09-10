const joi = require('joi');
const yaml = require('yaml');
const utils = require('../utils');
const xml2js = require('xml2js');

const XML_BUILDER = new xml2js.Builder();
const xmlFormatter = XML_BUILDER.buildObject.bind(XML_BUILDER);

const formatters = {
    'application/json': JSON.stringify,
    'application/xml': xmlFormatter,
    'application/x-yaml': yaml.stringify,
    'application/octet-stream': (protocolBuffer) => {
        const binary = protocolBuffer.serializeBinary
            ? protocolBuffer.serializeBinary()
            : new Uint8Array();
        return Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength)
    },
};

const OPTIONS_SCHEMA = joi.object({
    format: joi.string()
        .optional(),
    shapeFunction: joi.function()
        .arity(1)
        .optional(),
    getProtocolBuffer: joi.function()
        .arity(1)
        .optional(),
});

const DEFAULT_OPTIONS = {
    format: 'application/json',
    shapeFunction: (data) => data,
    getProtocolBuffer: (data) => data,
};

module.exports = {
    format(data, options = DEFAULT_OPTIONS) {
        const validatedOptions = utils.validate(OPTIONS_SCHEMA, options);
        const {
            format = DEFAULT_OPTIONS.format,
            shapeFunction = DEFAULT_OPTIONS.shapeFunction,
            getProtocolBuffer = DEFAULT_OPTIONS.getProtocolBuffer,
        } = validatedOptions;
        const targetType = (format in formatters)
            ? format
            : 'application/json';
        const targetFormatter = formatters[targetType];
        let formattedData = shapeFunction(data);
        if (format === 'application/octet-stream') {
            formattedData = getProtocolBuffer(formattedData);
        }
        return {
            formattedData: targetFormatter(formattedData),
            contentType: targetType,
        }
    },
};
