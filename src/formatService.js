const xml2js = require('xml2js');
const yaml = require('yaml');

const SUPPORTED_FORMATS = ['json', 'text', 'xml', 'yaml'];

const FORMAT_MIME_TYPES = {
    'json': 'application/json',
    'xml': 'application/xml',
}

const getDataShape = (data) => {
    return {
        total: data.length,
        results: data,
    };
}

const formatters = {
    'json': JSON.stringify,
    'text': (data) => [
        `total: ${data.total}`,
        ...data.results.map((entry) => Object.keys(entry)
            .map((key) => `${key}: ${entry[key]}`)
            .join(', ')),
    ].join('\n'),
    'xml': (data) => {
        return new xml2js.Builder().buildObject(data);
    },
    'yaml': yaml.stringify,
}

module.exports = {
    SUPPORTED_FORMATS,
    format(data, type = 'json') {
        const targetType = type.toLowerCase();
        const targetFormatter = formatters[targetType];
        return {
            formattedData: targetFormatter(getDataShape(data)),
            contentType: FORMAT_MIME_TYPES[targetType] || 'text/plain',
        }
    },
};
