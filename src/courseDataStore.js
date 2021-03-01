const path = require('path');
const fs = require('fs');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');

const courseComparisonFunction = (a, b) => {
    if (a.subject !== b.subject) {
        return a.subject.localeCompare(b.subject);
    }
    return a.code.localeCompare(b.code);
}

const containsWord = (source, word) => {
    return source.match(new RegExp(`\\b${word}\\b`, 'u')) !== null;
}

const defaultSearch = (values, data, key) => {
    return values.reduce((accumulatedCourses, value) => {
        const filteredCourses = data.filter((course) => course[key].startsWith(value));
        return accumulatedCourses.concat(filteredCourses);
    }, []);
}

const ignoredQueries = ['format'];

const queryTemplate = {
    'subject': {
        priority: 0,
    },
    'code': {
        priority: 1,
    },
    'isLab': {
        priority: 2,
        search: (_values, data, _key) => {
            return data.filter(({ name, code }) => {
                const lastCharacter = code[code.length - 1];
                const hasLabIdentifier = lastCharacter === 'L' || lastCharacter === 'C';
                return containsWord(name, 'Lab') || hasLabIdentifier;
            });
        },
    },
    'units': {
        priority: 3,
    },
}

const normalizeQueryValue = (queryValue) => {
    return ([].concat(queryValue)).map((value) => value.toUpperCase());
}

const courseDataStore = {
    _data: [],
    init() {
        const fileContents = fs.readFileSync(COURSE_DATA_PATH);
        const { data } = JSON.parse(fileContents);
        this._data = data.sort(courseComparisonFunction);
        return this;
    },
    queryBy(query) {
        const queryKeys = Object.keys(query)
        .filter((key) => !ignoredQueries.includes(key))
        .sort((a, b) => {
            return queryTemplate[a].priority - queryTemplate[b].priority;
        });
        return queryKeys.reduce((data, key) => {
            const search = queryTemplate[key].search || defaultSearch;
            return search(normalizeQueryValue(query[key]), data, key);
        }, this._data);
    },
}

module.exports = () => courseDataStore.init();
