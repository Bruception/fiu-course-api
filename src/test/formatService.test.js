const xml2js = require('xml2js');
const yaml = require('yaml');
const courseDataStore = require('../courseDataStore');
const formatService = require('../formatService');

describe('formatService: Testing the formatService module.', () => {
    test('formatService.format: Correctly serializes object to JSON when no format is specified.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, courseDataStore.formatOptions);
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to JSON.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            format: 'json',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'json',
            ...courseDataStore.formatOptions,
        });
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to YAML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'yaml',
            ...courseDataStore.formatOptions,
        });
        expect(yaml.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('text/plain');
    });
    test('formatService.format: Correctly serializes object to XML.', () => {
        const courses = courseDataStore.queryBy({
            subject: 'COP',
            units: '3.00',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'xml',
            ...courseDataStore.formatOptions,
        });
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
    test('formatService.format: Correctly serializes object with no provided options.', () => {
        const objectToSerialize = {
            version: '1.0.0',
            uptime: '1337',
            status: 'ok',
        };
        const { formattedData, contentType } = formatService.format(objectToSerialize);
        expect(formattedData).toMatchSnapshot();
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object with no provided shape function.', () => {
        const objectToSerialize = {
            version: '1.0.0',
            uptime: '1337',
            status: 'ok',
        };
        const { formattedData, contentType } = formatService.format(objectToSerialize, {
            format: 'yaml',
        });
        expect(formattedData).toMatchSnapshot();
        expect(contentType).toStrictEqual('text/plain');
    });
});
