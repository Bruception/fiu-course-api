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
    'json': (data) => {
        return JSON.stringify(getDataShape(data));
    },
    'text': (data) => {
        const buffer = [`results: ${data.length}`];
        data.forEach((entry) => {
            const line = [];
            Object.keys(entry).forEach((key) => {
                line.push(`${key}: ${entry[key]}`)
            });
            buffer.push(line.join(', '));
        });
        return buffer.join('\n');
    },
    'xml': (data) => {
        const xmlParseableObject = getXMLParsableObject(getDataShape(data));
        return xml(xmlParseableObject, true);
    },
    'yaml': (data) => {
        return yaml.stringify(getDataShape(data));
    },
}

module.exports = {
    SUPPORTED_FORMATS,
    format(data, type) {
        const targetFormatter = formatters[type] || formatters.json;
        return targetFormatter(data);
    }
};
