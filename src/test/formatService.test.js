const xml2js = require('xml2js');
const yaml = require('yaml');
const courseDataStore = require('../courseDataStore');
const formatService = require('../formatService');

describe('formatService: Testing the formatService module.', () => {
    test('formatService.format: Correctly serializes object to JSON when no format is specified.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses);
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to JSON.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            format: 'json',
        });
        const { formattedData, contentType } = formatService.format(courses, 'json');
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to YAML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, 'yaml');
        expect(yaml.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('text/plain');
    });
    test('formatService.format: Correctly serializes object to XML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            units: '3.00',
        });
        const { formattedData, contentType } = formatService.format(courses, 'xml');
        let parsedCourses;
        xml2js.parseString(formattedData,
            {
                explicitArray: false,
            },
            (_err, result) => {
                parsedCourses = result.root;
            }
        );
        expect(courses).toStrictEqual(parsedCourses.results);
        expect(courses.length).toStrictEqual(parseInt(parsedCourses.total));
        expect(contentType).toStrictEqual('application/xml');
    });
    test('formatService.format: Correctly serializes object to text.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            code: '2210',
        });
        const { formattedData, contentType } = formatService.format(courses, 'text');
        const formatStrings = formattedData.split('\n');
        expect(formatStrings[0]).toStrictEqual('total: 1');
        expect(formatStrings[1]).toStrictEqual('subject: COP, code: 2210, name: Programming I, units: 4.00, description: A first course in computer science that uses a structured programming language to study programming and problem solving on the computer. Includes the design, construction and analysis of programs.  Student participation in a closed instructional lab is required.  This course will have additional fees.');
        expect(contentType).toStrictEqual('text/plain');
    });
});
