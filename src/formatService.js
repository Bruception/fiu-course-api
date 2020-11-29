const SUPPORTED_FORMATS = ['json', 'text', 'xml'];

const formatters = {
    'json': (data) => {
        const dataShape = {
            total: data.length,
            results: data,
        };
        return JSON.stringify(dataShape);
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
        return data;
    },
}

module.exports = {
    SUPPORTED_FORMATS,
    format(data, type) {
        const targetFormatter = formatters[type || 'json'];
        return targetFormatter(data);
    }
};
