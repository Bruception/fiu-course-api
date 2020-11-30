const xml2js = require('xml2js');
const yaml = require('yaml');
const courseDataStore = require('../courseDataStore.js')();
const formatService = require('../formatService.js');

describe('formatService: Testing the formatService module.', () => {
    test('formatService.format: Correctly serializes object to JSON when no format is specified.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            isLab: '',
        });
        const formatString = formatService.format(courses);
        expect(JSON.parse(formatString).results).toStrictEqual(courses);
    });
    test('formatService.format: Correctly serializes object to JSON.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            isLab: '',
            format: 'json',
        });
        const formatString = formatService.format(courses, 'json');
        expect(JSON.parse(formatString).results).toStrictEqual(courses);
    });
    test('formatService.format: Correctly serializes object to YAML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            isLab: '',
        });
        const formatString = formatService.format(courses, 'yaml');
        expect(yaml.parse(formatString).results).toStrictEqual(courses);
    });
    test('formatService.format: Correctly serializes object to XML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            units: '3.00',
        });
        const formatString = formatService.format(courses, 'xml');
        let parsedCourses;
        xml2js.parseString(formatString,
            {
                explicitArray: false,
            },
            (_err, result) => {
                parsedCourses = result.root;
            }
        );
        expect(courses).toStrictEqual(parsedCourses.results);
        expect(courses.length).toStrictEqual(parseInt(parsedCourses.total));
    });
    test('formatService.format: Correctly serializes object to text.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            isLab: '',
        });
        const formatStrings = formatService.format(courses, 'text').split('\n');
        expect(formatStrings[0]).toStrictEqual('total: 1');
        expect(formatStrings[1]).toStrictEqual('subject: COP, code: 2210L, name: Lab for Programming I, units: 0.00, description: Lab component for Computer Programming I Lecture. Corequisite: COP 2210');
    });
});
