const fs = require('fs');
const path = require('path');
const words = require('talisman/tokenizers/words');
const lancaster = require('talisman/stemmers/lancaster');
const metaphone = require('talisman/phonetics/metaphone');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');
const IGNORED_QUERIES = ['format'];

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
    'keywords': {
        priority: 4,
        search: (values, data, _key) => {
            const tokens = words(values);
            if (tokens.length > 5) {
                throw Error('Number of keywords exceeds limit of 5.');
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
}

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
        this._data = data.sort(courseComparisonFunction);
        this._tokenCourseMap = getTokenCourseMap(this._data);
        return this;
    },
    queryBy(query) {
        const queryKeys = Object.keys(query)
        .filter((key) => !IGNORED_QUERIES.includes(key))
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
