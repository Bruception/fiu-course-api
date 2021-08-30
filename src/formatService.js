const joi = require('joi');
const yaml = require('yaml');
const utils = require('./utils');
const xml2js = require('xml2js');

const SUPPORTED_FORMATS = ['json', 'xml', 'yaml', 'protobuf'];

const OPTIONS_SCHEMA = joi.object({
    format: joi.string()
        .valid(...SUPPORTED_FORMATS)
        .insensitive()
        .optional(),
    shapeFunction: joi.function()
        .arity(1)
        .optional(),
    getProtocolBuffer: joi.function()
        .arity(1)
        .optional(),
});

const FORMAT_MIME_TYPES = {
    'json': 'application/json',
    'xml': 'application/xml',
    'protobuf': 'application/octet-stream',
};

const DEFAULT_OPTIONS = {
    format: 'json',
    shapeFunction: (data) => data,
    getProtocolBuffer: (data) => data,
}

const XML_BUILDER = new xml2js.Builder();
const xmlFormatter = XML_BUILDER.buildObject.bind(XML_BUILDER);

const formatters = {
    'json': JSON.stringify,
    'xml': xmlFormatter,
    'yaml': yaml.stringify,
    'protobuf': (protocolBuffer) => {
        const binary = protocolBuffer.serializeBinary
            ? protocolBuffer.serializeBinary()
            : new Uint8Array();
        return Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength)
    },
};

module.exports = {
    format(data, options = DEFAULT_OPTIONS) {
        const validatedOptions = utils.validate(OPTIONS_SCHEMA, options);
        const {
            format = DEFAULT_OPTIONS.format,
            shapeFunction = DEFAULT_OPTIONS.shapeFunction,
            getProtocolBuffer = DEFAULT_OPTIONS.getProtocolBuffer,
        } = validatedOptions;
        const targetType = format.toLowerCase();
        const targetFormatter = formatters[targetType];
        let formattedData = shapeFunction(data);
        if (format === 'protobuf') {
            formattedData = getProtocolBuffer(formattedData);
        }
        return {
            formattedData: targetFormatter(formattedData),
            contentType: FORMAT_MIME_TYPES[targetType] || 'text/plain',
        }
    },
};
