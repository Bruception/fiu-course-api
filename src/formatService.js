const xml = require('xml');
const yaml = require('yaml');

const SUPPORTED_FORMATS = ['json', 'text', 'xml', 'yaml'];

const getDataShape = (data) => {
    return {
        total: data.length,
        results: data,
    };
}

const getXMLParsableObject = (data) => {
    const mappedResults = data.results.map((result) => {
        const mappedProperties = Object.keys(result).map((property) => {
            return {
                [property]: result[property],
            };
        });
        return {
            result: mappedProperties,
        };
    });
    const xmlParseableObject = {
        root: [
            {
                total: data.total,
            },
            {
                results: mappedResults,
            },
        ],
    };
    return xmlParseableObject;
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
        const xmlParseableObject = getXMLParsableObject(data);
        return xml(xmlParseableObject, true);
    },
    'yaml': yaml.stringify,
}

module.exports = {
    SUPPORTED_FORMATS,
    format(data, type) {
        const targetFormatter = formatters[type] || formatters.json;
        return targetFormatter(getDataShape(data));
    }
};
