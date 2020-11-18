const fs = require('fs');

const courseComparisonFunction = (a, b) => {
    if (a.subject !== b.subject) {
        return a.subject < b.subject ? -1 : 1;
    }
    return a.code < b.code ? -1 : 1;
}

const searchBound = (value, data, key, isUpper) => {
    let left = 0;
    let right = data.length - 1;
    let middle = 0;
    let index = -1;
    while (left <= right) {
        middle = (((right - left) / 2) >> 0) + left;
        const entry = data[middle][key];
        if (entry.startsWith(value)) {
            index = middle;
            if (isUpper) {
                left = middle + 1;
            } else {
                right = middle - 1;
            }
        } else if (entry < value) {
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }
    return index;
}

const searchRange = (value, data, key) => {
    const lowerIndex = searchBound(value, data, key, false);
    const upperIndex = searchBound(value, data, key, true);
    return [lowerIndex, upperIndex];
}

const defaultSearch = (value, data, key) => {
    return data.filter((course) => course[key].startsWith(value));
}

const queryTemplate = {
    'subject': {
        priority: 0,
        search: (value, data, _key) => {
            const [min, max] = searchRange(value, data, 'subject');
            return data.slice(min, max);
        },
    },
    'code': {
        priority: 1,
    },
    'isLab': {
        priority: 2,
        search: (_value, data, _key) => {
            return data.filter((course) => course.name.indexOf('Lab') !== -1);
        },
    },
    'units': {
        priority: 3,
    },
}

module.exports = {
    init() {
        const fileContents = fs.readFileSync('./course-data.json');
        const { data } = JSON.parse(fileContents);
        this.data = data.sort(courseComparisonFunction);
    },
    queryBy(query) {
        const queryKeys = Object.keys(query).sort((a, b) => {
            return queryTemplate[a].priority - queryTemplate[b].priority;
        });
        return queryKeys.reduce((data, key) => {
            console.log(`Querying ${data.length} entries by ${key} for value "${query[key]}" ...`);
            const search = queryTemplate[key].search || defaultSearch;
            return search(query[key].toUpperCase(), data, key);
        }, this.data);
    },
};
