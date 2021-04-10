const fs = require('fs');
const joi = require('joi');
const path = require('path');
const utils = require('./utils');
const words = require('talisman/tokenizers/words');
const lancaster = require('talisman/stemmers/lancaster');
const metaphone = require('talisman/phonetics/metaphone');
const { SUPPORTED_FORMATS } = require('./formatService');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');

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
    format: joi.string()
        .valid(...SUPPORTED_FORMATS)
        .insensitive()
        .optional(),
    excludes: joi.string().optional(),
});

const IGNORED_QUERIES = ['format'];

const courseComparisonFunction = (a, b) => {
    if (a.subject !== b.subject) {
        return a.subject.localeCompare(b.subject);
    }
    return a.code.localeCompare(b.code);
}

const defaultFilter = (values, data, key) => {
    return values.reduce((accumulatedCourses, value) => {
        const filteredCourses = data.filter((course) => course[key].startsWith(value));
        return accumulatedCourses.concat(filteredCourses);
    }, []);
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
                return utils.containsWord(name, 'Lab') || hasLabIdentifier;
            });
        },
    },
    'keywords': {
        priority: 4,
        filter: (values, data, _key) => {
            const tokens = words(values);
            if (tokens.length > 5) {
                throw utils.error('Number of keywords exceeds limit of 5.', 400);
            }
            let isFirst = true;
            let matchedCourses = new Set();
            tokens.forEach((token) => {
                const tokenStem = lancaster(token);
                const tokenMetaphone = metaphone(token);
                const courses = courseDataStore._tokenCourseMap[tokenStem] ||
                    courseDataStore._tokenCourseMap[tokenMetaphone] || new Set();
                matchedCourses = (isFirst)
                    ? courses
                    : new Set([...matchedCourses].filter((course) => courses.has(course)));
                isFirst = false;
            });
            return data.filter(({ subject, code }) => {
                const courseKey = `${subject}${code}`;
                return matchedCourses.has(courseKey);
            });
        },
    },
    'excludes': {
        priority: Number.MAX_SAFE_INTEGER,
        filter: (values, data, _key) => {
            const normalizedValues = words(values.map((value) => value.toLowerCase()));
            return data.map((course) => utils.omit(course, normalizedValues)).filter((course) => course);
        },
    },
};

const normalizeQueryValue = (queryValue) => {
    return ([].concat(queryValue)).map((value) => value.toUpperCase());
}

const addToken = (token, tokenMap, courseKey) => {
    if (token.length === 0) {
        return;
    }
    if (!(token in tokenMap)) {
        tokenMap[token] = new Set();
    }
    tokenMap[token].add(courseKey);
}

const getTokenCourseMap = (courses) => {
    const tokenCourseMap = {};
    courses.forEach((course) => {
        const allWords = `${course.name} ${course.description}`;
        const tokens = words(allWords).map((word) => word.toUpperCase());
        const courseKey = `${course.subject}${course.code}`;
        tokens.forEach((token) => {
            const tokenStem = lancaster(token);
            const tokenMetaphone = metaphone(token);
            addToken(tokenStem, tokenCourseMap, courseKey);
            addToken(tokenMetaphone, tokenCourseMap, courseKey);
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
        this._data = data.sort(courseComparisonFunction).map(Object.freeze);
        this._tokenCourseMap = getTokenCourseMap(this._data);
        return this;
    },
    queryBy(query) {
        const { value, error } = QUERY_SCHEMA.validate(query);
        if (error) {
            throw utils.error(error.details[0].message, 400);
        }
        const queryKeys = Object.keys(value)
        .filter((key) => !IGNORED_QUERIES.includes(key))
        .sort((a, b) => {
            return queryTemplate[a].priority - queryTemplate[b].priority;
        });
        return queryKeys.reduce((data, key) => {
            const filter = queryTemplate[key].filter || defaultFilter;
            return filter(normalizeQueryValue(query[key]), data, key);
        }, this._data);
    },
}.init();

module.exports = {
    queryBy: courseDataStore.queryBy.bind(courseDataStore),
};
