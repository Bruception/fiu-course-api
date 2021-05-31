const courseDataStore = require('../courseDataStore');
const courseData = require('../data/course-data.json');

describe('courseDataStore: Testing the courseDataStore module.', () => {
    const containsWord = (source, word) => {
        return source.match(new RegExp(`\\b${word}\\b`, 'u')) != null;
    }    
    test('courseDataStore.queryBy: Empty query returns entire data.', () => {
        expect(courseDataStore.queryBy({}).length).toBe(courseData.data.length);
    });
    test('courseDataStore.queryBy: Query with subject "COP" returns only data with subject COP.', () => {
        const courseSubjects = courseDataStore.queryBy({
            subject: 'COP',
        }).map((course) => course.subject);
        expect(courseSubjects.length).toBeGreaterThan(0);
        courseSubjects.forEach((subject) => expect(subject).toMatch(/^COP/));
    });
    test('courseDataStore.queryBy: Query with subject "C" returns only data with subject that starts with C.', () => {
        const courseSubjects = courseDataStore.queryBy({
            subject: 'C',
        }).map((course) => course.subject);
        expect(courseSubjects.length).toBeGreaterThan(0);
        courseSubjects.forEach((subject) => expect(subject).toMatch(/^C/));
    });
    test('courseDataStore.queryBy: Query with code "2" returns only data with code that starts with 2.', () => {
        const courseCodes = courseDataStore.queryBy({
            code: '2',
        }).map((course) => course.code);
        expect(courseCodes.length).toBeGreaterThan(0);
        courseCodes.forEach((code) => expect(code).toMatch(/^2/));
    });
    test('courseDataStore.queryBy: Query isLab returns only data where name has Lab.', () => {
        const courses = courseDataStore.queryBy({
            isLab: '',
        });
        expect(courses.length).toBeGreaterThan(0);
        courses.forEach(({ name, code }) => {
            const lastCharacter = code[code.length - 1];
            const hasLabIdentifier = lastCharacter === 'L' || lastCharacter === 'C';
            expect(containsWord(name, 'Lab') || hasLabIdentifier).toBeTruthy();
        });
    });
    test('courseDataStore.queryBy: Query with units "3" returns only data where units starts with 3.', () => {
        const courseUnits = courseDataStore.queryBy({
            units: '3',
        }).map((course) => course.units);
        expect(courseUnits.length).toBeGreaterThan(0);
        courseUnits.forEach((units) => expect(units).toMatch(/^3/));
    });
    test('courseDataStore.queryBy: Combined query returns only courses matching data.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'ch',
            units: '1.00',
            isLab: '',
            code: '10',
            format: 'xml',
        });
        expect(courses.length).toBeGreaterThan(0);
        courses.forEach((course) => {
            expect(course.subject).toMatch(/^CH/);
            expect(course.units).toMatch(/^1\.00/);
            expect(course.name).toMatch(/Lab/);
            expect(course.code).toMatch(/^10/);
        });
    });
    test('courseDataStore.queryBy: Multi-value subject query returns only courses matching query.', () => {
        const courseNames = courseDataStore.queryBy({
            subject: ['COP', 'CAP'],
        }).map((course) => course.subject);
        expect(courseNames.length).toBeGreaterThan(0);
        courseNames.forEach((name) => {
            expect(name).toMatch(/^C[O,A]P/);
        });
    });
    test('courseDataStore.queryBy: Handles multiple multi-value queries and returns matching data.', () => {
        const courses = courseDataStore.queryBy({
            subject: ['COP', 'AST'],
            units: ['1', '0'],
            code: ['2', '3'],
        });
        expect(courses.length).toBeGreaterThan(0);
        courses.forEach((course) => {
            expect(course.subject).toMatch(/^(COP|AST)/);
            expect(course.units).toMatch(/^(1|0)/);
            expect(course.code).toMatch(/^(2|3)/);
        });
    });
    test('courseDataStore.queryBy: Disallows more than 5 keywords.', () => {
        const testQuery = () => {
            return courseDataStore.queryBy({
                keywords: 'one two three four five six',
            });
        }
        expect(testQuery).toThrow(Error);
    });
    test('courseDataStore.queryBy: Fuzzy matches keyword.', () => {
        const coursesWithDistribution = courseDataStore.queryBy({
            keywords: 'distribution',
        });
        const coursesWithDistributed = courseDataStore.queryBy({
            keywords: 'distributed',
        });
        const coursesWithDistribute = courseDataStore.queryBy({
            keywords: 'distribute',
        });
        expect(coursesWithDistribution).toEqual(coursesWithDistributed);
        expect(coursesWithDistributed).toEqual(coursesWithDistribute);
    });
    test('courseDataStore.queryBy: Multiple keyword search works.', () => {
        const courses = courseDataStore.queryBy({
            keywords: 'electricity magnets theory',
        });
        expect(courses.length).toBeGreaterThan(0);
    });
    test('courseDataStore.queryBy: Unknown keyword returns no courses.', () => {
        const courses = courseDataStore.queryBy({
            keywords: '😋',
        });
        expect(courses.length).toBe(0);
    });
    test('courseDataStore.queryBy: Correctly excludes single property.', () => {
        const courses = courseDataStore.queryBy({
            excludes: 'description',
        });
        const includedProperties = ['subject', 'code', 'name', 'units'];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataStore.queryBy: Correctly excludes multiple properties.', () => {
        const courses = courseDataStore.queryBy({
            excludes: 'description units name',
        });
        const includedProperties = ['subject', 'code'];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataStore.queryBy: Correctly excludes all properties with kleene star.', () => {
        const courses = courseDataStore.queryBy({
            excludes: '*',
        });
        const includedProperties = [];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataStore.queryBy: Correctly limits data.', () => {
        const courses = courseDataStore.queryBy({
            limit: '10',
        });
        expect(courses.length).toBeLessThanOrEqual(10);
    });
    test('courseDataStore.queryBy: Correctly handles invalud limits.', () => {
        const testQuery = () => {
            return courseDataStore.queryBy({
                limit: -10,
            });
        }
        expect(testQuery).toThrow(Error);
    });
    test('courseDataStore.queryBy: Correctly filters duplicate data.', () => {
        const courses = courseDataStore.queryBy({
            subject: ['COP', 'C', 'AST', 'A'],
        });
        const uniqueCourses = [...new Set(courses)];
        expect(uniqueCourses.length).toEqual(courses.length);
        uniqueCourses.forEach((course, index) => {
            expect(course).toBe(courses[index]);
        });
    });
});
