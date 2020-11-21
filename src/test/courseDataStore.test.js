const courseDataStore = require('../courseDataStore.js')();
const courseData = require('../data/course-data.json');

describe('courseDataStore: Testing the courseDataStore module.', () => {
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
        const courseNames = courseDataStore.queryBy({
            isLab: '',
        }).map((course) => course.name);
        expect(courseNames.length).toBeGreaterThan(0);
        courseNames.forEach((name) => expect(name).toMatch(/Lab/));
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
});
