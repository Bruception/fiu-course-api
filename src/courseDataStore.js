const joi = require('joi');
const _ = require('lodash');
const path = require('path');
const utils = require('./utils');
const coursePB = require('./protos/course_pb');
const words = require('talisman/tokenizers/words');
const lancaster = require('talisman/stemmers/lancaster');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');
const STOP_WORDS_DATA_PATH = path.resolve(__dirname, './data/stopwords.json');

const getStopWords = (stopWordsPath) => {
    const { stopwords } = require(stopWordsPath);
    const normalizedStopWords = stopwords.map((word) => word.toUpperCase());
    return new Set(normalizedStopWords);
}

const IGNORED_PARAMETERS = ['format'];
const COURSE_PROPERTIES = ['subject', 'code', 'name', 'units', 'description'];
const STOP_WORDS = getStopWords(STOP_WORDS_DATA_PATH);

const STRING_PARAMETER_SCHEMA = joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string()),
);

const QUERY_SCHEMA = joi.object({
    subject: STRING_PARAMETER_SCHEMA,
    code: STRING_PARAMETER_SCHEMA,
    units: STRING_PARAMETER_SCHEMA,
    keywords: joi.string(),
    isLab: joi.string().valid(''),
    excludes: joi.string(),
    skip: joi.number().integer().min(0),
    limit: joi.number().integer().min(0),
    sortBy: joi.string().valid(...COURSE_PROPERTIES),
    reverseOrder: joi.string().valid(''),
});

const defaultFilter = (values, data, key) => {
    const aggregateCourses = values.reduce((accumulatedCourses, value) => {
        const filteredCourses = data.filter((course) => course[key].startsWith(value));
        return accumulatedCourses.concat(filteredCourses);
    }, []);
    return [...new Set(aggregateCourses)];
}

const defaultValueFormatter = (value) => {
    return value.toUpperCase();
}

const lowerCaseValueFormatter = (value) => {
    return value.toLowerCase();
}

const integerFormatter = (value) => {
    return parseInt(value, 10);
}

const parameterMap = {
    subject: {},
    code: {},
    units: {},
    isLab: {
        filter: (_values, data, _key) => {
            return data.filter(({ name, code }) => {
                const lastCharacter = code[code.length - 1];
                const hasLabIdentifier = lastCharacter === 'L' || lastCharacter === 'C';
                return hasLabIdentifier || utils.containsWord(name, 'Lab');
            });
        },
    },
    keywords: {
        filter: (values, data, _key) => {
            const tokens = words(values).filter((token) => !STOP_WORDS.has(token));
            if (tokens.length > 5) {
                throw utils.error('Number of keywords exceeds limit of 5.', 400);
            }
            let matchedCourses = new Set();
            tokens.forEach((token, i) => {
                const normalizedToken = token.replace(/[^0-9a-zA-Z]/giu, '');
                const tokenStem = lancaster(normalizedToken);
                const courses = courseDataStore._tokenToCoursesMap[tokenStem] || new Set();
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
    sortBy: {
        filter: (values, data, _key) => {
            const [sortKey] = values;
            const newData = [...data];
            newData.sort((course, otherCourse) => {
                return course[sortKey].localeCompare(otherCourse[sortKey]);
            });
            return newData;
        },
        valueFormatter: lowerCaseValueFormatter,
    },
    reverseOrder: {
        filter: (_values, data, _key) => {
            return [...data].reverse();
        },
    },
    skip: {
        filter: (values, data, _key) => {
            const [offset] = values;
            return data.slice(offset);
        },
        valueFormatter: integerFormatter
    },
    limit: {
        filter: (values, data, _key) => {
            const [max] = values;
            return data.slice(0, max);
        },
        valueFormatter: integerFormatter
    },
    excludes: {
        filter: (values, data, _key) => {
            const normalizedValues = values.includes('*')
                ? COURSE_PROPERTIES
                : words(values);
            return data.map((course) => _.omit(course, normalizedValues));
        },
        valueFormatter: lowerCaseValueFormatter,
    },
};

const getTokenToCoursesMap = (courses) => {
    const tokenToCoursesMap = {};
    courses.forEach((course) => {
        const allWords = `${course.subject} ${course.code} ${course.name} ${course.description}`;
        const tokens = words(allWords)
            .map((word) => word.toUpperCase().replace(/[^0-9a-zA-Z]/giu, ''))
            .filter((word) => !STOP_WORDS.has(word))
            .map(lancaster);
        const courseKey = `${course.subject}${course.code}`;
        tokens.forEach((token) => {
            if (token.length === 0) {
                return;
            }
            if (!(token in tokenToCoursesMap)) {
                tokenToCoursesMap[token] = new Set();
            }
            tokenToCoursesMap[token].add(courseKey);
        });
    });
    return tokenToCoursesMap;
}

const normalizeParameterValue = (parameterKey, parameterValue) => {
    const valueFormatter = parameterMap[parameterKey].valueFormatter || defaultValueFormatter;
    return [...new Set(([].concat(parameterValue)).map(valueFormatter))];
}

const normalizeSource = (sourceQuery) => {
    const relevantParameters = _.omit(sourceQuery, IGNORED_PARAMETERS);
    const validatedQuery = utils.validate(QUERY_SCHEMA, relevantParameters);
    const normalizedQuery = _.mapValues(validatedQuery, (parameter, key) => {
        return normalizeParameterValue(key, parameter);
    });
    return normalizedQuery;
}

const courseDataStore = {
    _data: [],
    _tokenToCoursesMap: {},
    init() {
        const { data, dataAsOf } = require(COURSE_DATA_PATH);
        this._data = data.map(Object.freeze);
        this._dataAsOf = dataAsOf;
        this._tokenToCoursesMap = getTokenToCoursesMap(this._data);
        Object.keys(parameterMap).forEach((parameter, index) => {
            parameterMap[parameter].priority = index;
        });
        return this;
    },
    queryBy(sources) {
        const normalizedSources = [].concat(sources).map(normalizeSource);
        const completeQuery = _.mergeWith({}, ...normalizedSources, _.union);
        const queryParameters = Object.keys(completeQuery).sort((a, b) => {
            return parameterMap[a].priority - parameterMap[b].priority;
        });
        return queryParameters.reduce((data, key) => {
            const filter = parameterMap[key].filter || defaultFilter;
            return filter(completeQuery[key], data, key);
        }, this._data);
    },
}.init();

module.exports = {
    dataAsOf: courseDataStore._dataAsOf,
    queryBy: courseDataStore.queryBy.bind(courseDataStore),
    formatOptions: {
        shapeFunction: (data) => {
            return {
                total: data.length,
                results: data.filter((value) => Object.keys(value).length !== 0),
            }
        },
        getProtocolBuffer: (data) => {
            const courseAPIDataProto = new coursePB.CourseAPIResponseData();
            courseAPIDataProto.setTotal(data.total);
            data.results.forEach((result) => {
                const courseProto = new coursePB.Course();
                courseProto.setSubject(result.subject);
                courseProto.setCode(result.code);
                courseProto.setName(result.name);
                courseProto.setUnits(result.units);
                courseProto.setDescription(result.description);
                courseAPIDataProto.addResults(courseProto);
            });
            return courseAPIDataProto;
        },
    },
};
