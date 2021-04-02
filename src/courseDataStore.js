const fs = require('fs');
const path = require('path');
const words = require('talisman/tokenizers/words');
const porter = require('talisman/stemmers/porter');
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
            const matchedCourses = new Set();
            const tokens = words(values).map(porter);
            if (tokens.length > 5) {
                throw Error('Number of keywords exceeds limit of 5.');
            }
            tokens.forEach((token) => {
                const tokenMetaphone = metaphone(token);
                const courses = courseDataStore._tokenCourseMap[token] ||
                    courseDataStore._tokenCourseMap[tokenMetaphone] || [];
                courses.forEach((course) => {
                    matchedCourses.add(course);
                });
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

const getTokenCourseMap = (courses) => {
    const tokenCourseMap = {};
    courses.forEach((course) => {
        const tokens = words(course.description).map((word) => {
            return porter(word.toUpperCase());
        });
        const courseKey = `${course.subject}${course.code}`;
        tokens.forEach((token) => {
            if (!(token in tokenCourseMap)) {
                tokenCourseMap[token] = new Set();
            }
            tokenCourseMap[token].add(courseKey);
            const tokenMetaphone = metaphone(token);
            if (tokenMetaphone.length === 0) {
                return;
            }
            if (!(tokenMetaphone in tokenCourseMap)) {
                tokenCourseMap[tokenMetaphone] = new Set();
            }
            tokenCourseMap[tokenMetaphone].add(courseKey);
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
