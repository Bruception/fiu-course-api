const fs = require('fs');
const joi = require('joi');
const path = require('path');
const utils = require('./utils');
const words = require('talisman/tokenizers/words');
const lancaster = require('talisman/stemmers/lancaster');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');
const STOP_WORDS_DATA_PATH = path.resolve(__dirname, './data/stopwords.json');

const getStopWords = (stopWordsPath) => {
    const stopWordsBuffer = fs.readFileSync(stopWordsPath);
    const { stopwords } = JSON.parse(stopWordsBuffer);
    const normalizedStopWords = stopwords.map((word) => word.toUpperCase());
    return new Set(normalizedStopWords);
}

const STOP_WORDS = getStopWords(STOP_WORDS_DATA_PATH);

const STRING_QUERY_SCHEMA = joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string()),
).optional();

const QUERY_SCHEMA = joi.object({
    subject: STRING_QUERY_SCHEMA,
    code: STRING_QUERY_SCHEMA,
    units: STRING_QUERY_SCHEMA,
    keywords: joi.string().optional(),
    isLab: joi.optional(),
    excludes: joi.string().optional(),
    limit: joi.number().positive().optional(),
});

const IGNORED_QUERIES = ['format'];
const COURSE_PROPERTIES = ['subject', 'code', 'name', 'units', 'description'];

const defaultFilter = (values, data, key) => {
    const aggregatecourses = values.reduce((accumulatedCourses, value) => {
        const filteredCourses = data.filter((course) => course[key].startsWith(value));
        return accumulatedCourses.concat(filteredCourses);
    }, []);
    return [...new Set(aggregatecourses)];
}

const defaultValueFormatter = (value) => {
    return value.toUpperCase();
}

const queryTemplate = {
    'subject': {
        priority: 0,
    },
    'code': {
        priority: 1,
    },
    'units': {
        priority: 2,
    },
    'isLab': {
        priority: 3,
        filter: (_values, data, _key) => {
            return data.filter(({ name, code }) => {
                const lastCharacter = code[code.length - 1];
                const hasLabIdentifier = lastCharacter === 'L' || lastCharacter === 'C';
                return hasLabIdentifier || utils.containsWord(name, 'Lab');
            });
        },
    },
    'keywords': {
        priority: 4,
        filter: (values, data, _key) => {
            const tokens = words(values).filter((token) => !STOP_WORDS.has(token));
            if (tokens.length > 5) {
                throw utils.error('Number of keywords exceeds limit of 5.', 400);
            }
            let matchedCourses = new Set();
            tokens.forEach((token, i) => {
                const tokenStem = lancaster(token);
                const courses = courseDataStore._tokenCourseMap[tokenStem] || new Set();
                matchedCourses = (i === 0)
                    ? courses
                    : new Set([...matchedCourses].filter((course) => courses.has(course)));
            });
            return data.filter(({ subject, code }) => {
                const courseKey = `${subject}${code}`;
                return matchedCourses.has(courseKey);
            });
        },
    },
    'limit': {
        priority: Number.MAX_SAFE_INTEGER - 1,
        filter: (values, data, _key) => {
            const [max] = values;
            return data.slice(0, max);
        },
        valueFormatter: (value) => {
            return parseInt(value, 10);
        },
    },
    'excludes': {
        priority: Number.MAX_SAFE_INTEGER,
        filter: (values, data, _key) => {
            const normalizedValues = values.includes('*')
                ? COURSE_PROPERTIES
                : words(values);
            return data.map((course) => utils.omit(course, normalizedValues));
        },
        valueFormatter: (value) => {
            return value.toLowerCase();
        },
    },
};

const normalizeQueryValue = (queryKey, queryValue) => {
    const valueFormatter = queryTemplate[queryKey].valueFormatter || defaultValueFormatter;
    return [...new Set(([].concat(queryValue)).map(valueFormatter))];
}

const getTokenCourseMap = (courses) => {
    const tokenCourseMap = {};
    courses.forEach((course) => {
        const allWords = `${course.name} ${course.description}`;
        const tokens = words(allWords)
            .map((word) => word.toUpperCase())
            .filter((word) => !STOP_WORDS.has(word))
            .map(lancaster);
        const courseKey = `${course.subject}${course.code}`;
        tokens.forEach((token) => {
            if (!(token in tokenCourseMap)) {
                tokenCourseMap[token] = new Set();
            }
            tokenCourseMap[token].add(courseKey);
        });
    });
    return tokenCourseMap;
}

const courseDataStore = {
    _data: [],
    _tokenCourseMap: {},
    init() {
        const fileContents = fs.readFileSync(COURSE_DATA_PATH);
        const { data } = JSON.parse(fileContents);
        this._data = data.map(Object.freeze);
        this._tokenCourseMap = getTokenCourseMap(this._data);
        return this;
    },
    queryBy(query) {
        const validatedQuery = utils.validate(QUERY_SCHEMA, utils.omit(query, IGNORED_QUERIES));
        const queryKeys = Object.keys(validatedQuery).sort((a, b) => {
            return queryTemplate[a].priority - queryTemplate[b].priority;
        });
        return queryKeys.reduce((data, key) => {
            const filter = queryTemplate[key].filter || defaultFilter;
            const normalizedValue = normalizeQueryValue(key, query[key]);
            return filter(normalizedValue, data, key);
        }, this._data);
    },
}.init();

module.exports = {
    queryBy: courseDataStore.queryBy.bind(courseDataStore),
    formatOptions: {
        shapeFunction: (data) => {
            return {
                total: data.length,
                results: data.filter((value) => Object.keys(value).length !== 0),
            }
        },
    },
};
