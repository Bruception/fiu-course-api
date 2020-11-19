const courseRepo = require('../courseRepo.js')();
const courseData = require('../data/course-data.json');

describe('courseRepo: Testing the courseRepo module.', () => {
    test('courseRepo.queryBy: Empty query returns entire data.', () => {
        expect(courseRepo.queryBy({}).length).toBe(courseData.data.length);
    });
    test('courseRepo.queryBy: Query with subject "COP" returns only data with subject COP.', () => {
        const courseSubjects = courseRepo.queryBy({
            subject: 'COP',
        }).map((course) => course.subject);
        courseSubjects.forEach((subject) => expect(subject).toBe('COP'));
    });
    test('courseRepo.queryBy: Query with subject "C" returns only data with subject that starts with C.', () => {
        const courseSubjects = courseRepo.queryBy({
            subject: 'C',
        }).map((course) => course.subject);
        courseSubjects.forEach((subject) => expect(subject.charAt(0)).toBe('C'));
    });
    test('courseRepo.queryBy: Query with code "2" returns only data with code that starts with 2.', () => {
        const courseCodes = courseRepo.queryBy({
            code: '2',
        }).map((course) => course.code);
        courseCodes.forEach((code) => expect(code.charAt(0)).toBe('2'));
    });
    test('courseRepo.queryBy: Query isLab returns only data where name has Lab.', () => {
        const courseNames = courseRepo.queryBy({
            isLab: '',
        }).map((course) => course.name);
        courseNames.forEach((name) => expect(name.indexOf('Lab')).toBeGreaterThanOrEqual(0));
    });
    test('courseRepo.queryBy: Query with units "3" returns only data where units starts with 3.', () => {
        const courseUnits = courseRepo.queryBy({
            units: '3',
        }).map((course) => course.units);
        courseUnits.forEach((units) => expect(units.charAt(0)).toBe('3'));
    });
    test('courseRepo.queryBy: Combined query returns only courses matching data.', () => {
        const courses = courseRepo.queryBy({
            subject: 'ch',
            units: '1.00',
            isLab: '',
            code: '10',
        });
        courses.forEach((course) => {
            expect(course.subject.startsWith('CH')).toBe(true);
            expect(course.units).toBe('1.00');
            expect(course.name.indexOf('Lab')).toBeGreaterThanOrEqual(0);
            expect(course.code.startsWith('10')).toBe(true);
        });
    });
});
