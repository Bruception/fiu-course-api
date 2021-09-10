const xml2js = require('xml2js');
const yaml = require('yaml');
const { courseDataService, formatService } = require('../services');
const servicePB = require('../protos/service_pb');

describe('formatService: Testing the formatService module.', () => {
    test('formatService.format: Correctly serializes object to JSON when no format is specified.', () => {
        const courses = courseDataService.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, courseDataService.formatOptions);
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to JSON when unknown format is specified.', () => {
        const courses = courseDataService.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'unknown',
            ...courseDataService.formatOptions,
        });
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to JSON.', () => {
        const courses = courseDataService.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'application/json',
            ...courseDataService.formatOptions,
        });
        expect(JSON.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/json');
    });
    test('formatService.format: Correctly serializes object to YAML.', () => {
        const courses = courseDataService.queryBy({
            subject: 'COP',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'application/x-yaml',
            ...courseDataService.formatOptions,
        });
        expect(yaml.parse(formattedData).results).toStrictEqual(courses);
        expect(contentType).toStrictEqual('application/x-yaml');
    });
    test('formatService.format: Correctly serializes object to XML.', () => {
        const courses = courseDataService.queryBy({
            subject: 'COP',
            units: '3.00',
        });
        const { formattedData, contentType } = formatService.format(courses, {
            format: 'application/xml',
            ...courseDataService.formatOptions,
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
            format: 'application/x-yaml',
        });
        expect(formattedData).toMatchSnapshot();
        expect(contentType).toStrictEqual('application/x-yaml');
    });
    test('formatService.format: Correctly serializes object to a protocol buffer.', () => {
        const objectToSerialize = {
            version: '1.0.0',
            uptime: 1337,
            dataAsOf: 12345,
            requestsFulfilled: 123,
        };
        const { formattedData, contentType } = formatService.format(objectToSerialize, {
            format: 'application/octet-stream',
            getProtocolBuffer: (data) => {
                const statusProto = new servicePB.Status();
                statusProto.setVersion(data.version);
                statusProto.setUptime(data.uptime);
                statusProto.setDataasof(data.dataAsOf);
                statusProto.setRequestsfulfilled(data.requestsFulfilled);
                return statusProto;
            },
        });
        expect(formattedData).toMatchSnapshot();
        expect(contentType).toStrictEqual('application/octet-stream');
    });
    test('formatService.format: Correctly serializes handles missing getProtocolBuffer function.', () => {
        const objectToSerialize = {
            data: 'test',
        };
        const { formattedData, contentType } = formatService.format(objectToSerialize, {
            format: 'application/octet-stream',
        });
        expect(formattedData).toEqual(Buffer.from(''));
        expect(contentType).toStrictEqual('application/octet-stream');
    });
});
