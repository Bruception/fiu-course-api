const { courseDataService } = require('../services');
const courseData = require('../data/course-data.json');

describe('courseDataService: Testing the courseDataService module.', () => {
    const containsWord = (source, word) => {
        return source.match(new RegExp(`\\b${word}\\b`, 'u')) != null;
    }
    test('courseDataService.queryBy: Empty query returns entire data.', () => {
        expect(courseDataService.queryBy({}).length).toBe(courseData.data.length);
    });
    test('courseDataService.queryBy: Query with subject "COP" returns only data with subject COP.', () => {
        const courseSubjects = courseDataService.queryBy({
            subject: 'COP',
        }).map((course) => course.subject);
        expect(courseSubjects.length).toBeGreaterThan(0);
        courseSubjects.forEach((subject) => expect(subject).toMatch(/^COP/));
    });
    test('courseDataService.queryBy: Query with subject "C" returns only data with subject that starts with C.', () => {
        const courseSubjects = courseDataService.queryBy({
            subject: 'C',
        }).map((course) => course.subject);
        expect(courseSubjects.length).toBeGreaterThan(0);
        courseSubjects.forEach((subject) => expect(subject).toMatch(/^C/));
    });
    test('courseDataService.queryBy: Query with code "2" returns only data with code that starts with 2.', () => {
        const courseCodes = courseDataService.queryBy({
            code: '2',
        }).map((course) => course.code);
        expect(courseCodes.length).toBeGreaterThan(0);
        courseCodes.forEach((code) => expect(code).toMatch(/^2/));
    });
    test('courseDataService.queryBy: Query isLab returns only data where name has Lab.', () => {
        const courses = courseDataService.queryBy({
            isLab: true,
        });
        expect(courses.length).toBeGreaterThan(0);
        courses.forEach(({ name, code }) => {
            const lastCharacter = code[code.length - 1];
            const hasLabIdentifier = lastCharacter === 'L' || lastCharacter === 'C';
            expect(containsWord(name, 'Lab') || hasLabIdentifier).toBeTruthy();
        });
    });
    test('courseDataService.queryBy: Query with units "3" returns only data where units starts with 3.', () => {
        const courseUnits = courseDataService.queryBy({
            units: '3',
        }).map((course) => course.units);
        expect(courseUnits.length).toBeGreaterThan(0);
        courseUnits.forEach((units) => expect(units).toMatch(/^3/));
    });
    test('courseDataService.queryBy: Combined query returns only courses matching data.', () => {
        const courses = courseDataService.queryBy({
            subject: 'ch',
            units: '1.00',
            isLab: true,
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
    test('courseDataService.queryBy: Multi-value subject query returns only courses matching query.', () => {
        const courseNames = courseDataService.queryBy({
            subject: ['COP', 'CAP'],
        }).map((course) => course.subject);
        expect(courseNames.length).toBeGreaterThan(0);
        courseNames.forEach((name) => {
            expect(name).toMatch(/^C[O,A]P/);
        });
    });
    test('courseDataService.queryBy: Handles multiple multi-value queries and returns matching data.', () => {
        const courses = courseDataService.queryBy({
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
    test('courseDataService.queryBy: Disallows more than 5 keywords.', () => {
        const testQuery = () => {
            return courseDataService.queryBy({
                keywords: 'one two three four five six',
            });
        }
        expect(testQuery).toThrow(Error);
    });
    test('courseDataService.queryBy: Fuzzy matches keyword.', () => {
        const coursesWithDistribution = courseDataService.queryBy({
            keywords: 'distribution',
        });
        const coursesWithDistributed = courseDataService.queryBy({
            keywords: 'distributed',
        });
        const coursesWithDistribute = courseDataService.queryBy({
            keywords: 'distribute',
        });
        expect(coursesWithDistribution).toEqual(coursesWithDistributed);
        expect(coursesWithDistributed).toEqual(coursesWithDistribute);
    });
    test('courseDataService.queryBy: Multiple keyword search works.', () => {
        const courses = courseDataService.queryBy({
            keywords: 'electricity magnets theory',
        });
        expect(courses.length).toBeGreaterThan(0);
    });
    test('courseDataService.queryBy: Unknown keyword returns no courses.', () => {
        const courses = courseDataService.queryBy({
            keywords: '😋',
        });
        expect(courses.length).toBe(0);
    });
    test('courseDataService.queryBy: Correctly excludes single property.', () => {
        const courses = courseDataService.queryBy({
            excludes: 'description',
        });
        const includedProperties = ['subject', 'code', 'name', 'units'];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataService.queryBy: Correctly excludes multiple properties.', () => {
        const courses = courseDataService.queryBy({
            excludes: 'description units name',
        });
        const includedProperties = ['subject', 'code'];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataService.queryBy: Correctly excludes all properties with kleene star.', () => {
        const courses = courseDataService.queryBy({
            excludes: '*',
        });
        const includedProperties = [];
        courses.forEach((course) => {
            expect(Object.keys(course)).toEqual(includedProperties);
        });
    });
    test('courseDataService.queryBy: Correctly limits data.', () => {
        const courses = courseDataService.queryBy({
            limit: '10',
        });
        expect(courses.length).toBeLessThanOrEqual(10);
    });
    test('courseDataService.queryBy: Correctly handles invalud limits.', () => {
        const testQuery = () => {
            return courseDataService.queryBy({
                limit: -10,
            });
        }
        expect(testQuery).toThrow(Error);
    });
    test('courseDataService.queryBy: Correctly filters duplicate data.', () => {
        const courses = courseDataService.queryBy({
            subject: ['COP', 'C', 'AST', 'A'],
        });
        const uniqueCourses = [...new Set(courses)];
        expect(uniqueCourses.length).toEqual(courses.length);
        uniqueCourses.forEach((course, index) => {
            expect(course).toBe(courses[index]);
        });
    });
    test('courseDataService.queryBy: Correctly sorts data with the sortBy parameter.', () => {
        const courses = courseDataService.queryBy({
            subject: ['A', 'C'],
            sortBy: 'name',
        });
        let currentName = courses[0].name;
        courses.forEach((course) => {
            expect(course.name.localeCompare(currentName) >= 0).toBe(true);
            currentName = course.name;
        });
    });
    test('courseDataService.queryBy: Correctly reverses order of data with the reverseOrder parameter.', () => {
        const courses = courseDataService.queryBy({
            subject: ['A', 'C'],
            sortBy: 'name',
            reverseOrder: true,
        });
        let currentName = courses[0].name;
        courses.forEach((course) => {
            expect(course.name.localeCompare(currentName) <= 0).toBe(true);
            currentName = course.name;
        });
    });
    test('courseDataService.queryBy: Handles multiple source queries.', () => {
        const courses = courseDataService.queryBy([
            {
                subject: ['COP', 'CAP', 'AST'],
                limit: 50,
                sortBy: 'name',
                units: ['3', '4'],
                excludes: 'code description',
            },
            {
                subject: 'CEN',
                limit: 100,
                sortBy: 'subject',
                units: ['3.'],
                excludes: 'description',
            },
            {
                subject: 'bSc',
                units: '4.',
            },
        ]);
        expect(courses.length).toBeLessThanOrEqual(50);
        let currentName = courses[0].name;
        courses.forEach((course) => {
            expect(course.subject).toMatch(/^(COP|CAP|AST|CEN|BSC)/);
            expect(course.units).toMatch(/^(3|4|3\.|4\.)/);
            expect(course.code).toBe(undefined);
            expect(course.description).toBe(undefined);
            expect(course.name.localeCompare(currentName) >= 0).toBe(true);
            currentName = course.name;
        });
    });
    test('courseDataService.queryBy: Does not mutate the in-memory data.', () => {
        const allCourses = courseDataService.queryBy();
        const coursesSortedByUnits = courseDataService.queryBy({
            sortBy: 'units',
            reverseOrder: false,
        });
        const coursesReversed = courseDataService.queryBy({
            reverseOrder: true,
        });
        const allCoursesAfter = courseDataService.queryBy();
        expect(allCourses).toBe(allCoursesAfter);
    });
    test('courseDataService.queryBy: Correctly paginates data using the skip and limit parameters.', () => {
        const allCourses = courseDataService.queryBy();
        for (let limit = 1; limit <= 1000; limit *= 10) {
            for (let offset = 0; offset < allCourses.length + limit; offset += limit) {
                const paginatedData = courseDataService.queryBy({
                    limit,
                    skip: offset,
                });
                const expectedData = allCourses.slice(offset, offset + limit);
                expect(paginatedData).toEqual(expectedData);
            }
        }
    });
});
