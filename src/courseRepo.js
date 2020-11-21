const path = require('path');
const fs = require('fs');

const COURSE_DATA_PATH = path.resolve(__dirname, './data/course-data.json');

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

const defaultSearch = (values, data, key) => {
    return values.reduce((accumulatedCourses, value) => {
        const filteredCourses = data.filter((course) => course[key].startsWith(value));
        return accumulatedCourses.concat(filteredCourses);
    }, []);
}

const queryTemplate = {
    'subject': {
        priority: 0,
        search: (values, data, _key) => {
            return values.reduce((accumulatedCourses, value) => {
                const [min, max] = searchRange(value, data, 'subject');
                const coursesInRange = data.slice(min, max);
                return accumulatedCourses.concat(coursesInRange);
            }, []);
        },
    },
    'code': {
        priority: 1,
    },
    'isLab': {
        priority: 2,
        search: (_values, data, _key) => {
            return data.filter((course) => course.name.indexOf('Lab') !== -1);
        },
    },
    'units': {
        priority: 3,
    },
}

const normalizeQueryKey = (queryKey) => {
    return [].concat(queryKey);
}

const courseRepo = {
    init() {
        const fileContents = fs.readFileSync(COURSE_DATA_PATH);
        const { data } = JSON.parse(fileContents);
        this.data = data.sort(courseComparisonFunction);
        return this;
    },
    queryBy(query) {
        const queryKeys = Object.keys(query).sort((a, b) => {
            return queryTemplate[a].priority - queryTemplate[b].priority;
        });
        return queryKeys.reduce((data, key) => {
            const search = queryTemplate[key].search || defaultSearch;
            return search(normalizeQueryKey(query[key]), data, key);
        }, this.data);
    },
}

module.exports = () => courseRepo.init()
