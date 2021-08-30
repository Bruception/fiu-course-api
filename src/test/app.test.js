const yaml = require('yaml');
const request = require('supertest');

const { app, server } = require('../app');
const { version } = require('../../package.json');
const coursePB = require('../protos/course_pb');
const servicePB = require('../protos/service_pb');
const courseData = require('../data/course-data.json');

describe('app: Testing endpoints.', () => {
    describe('app: Testing /api endpoint.', () => {
        test('/api: Queryless request returns all data.', async () => {
            const { statusCode, text } = await request(app).get('/api');
            expect(statusCode).toBe(200);
            expect(JSON.parse(text).total).toBe(courseData.data.length);
        });
        test('/api: Request with subject query returns all related data.', async () => {
            const response = await request(app).get('/api?subject=COP&isLab&units=0.00&code=2');
            const { total, results } = JSON.parse(response.text);
            expect(response.statusCode).toBe(200);
            expect(total).toBe(results.length);
            expect(results).toBeTruthy();
        });
        test('/api: Request with invalid query is handled properly.', async () => {
            const response = await request(app).get('/api?invalidquery=invalidvalue123'); 
            const { error } = response.body;
            expect(response.statusCode).toBe(400);
            expect(error).toBe('"invalidquery" is not allowed');
        });
        test('/api: Protocol buffer serialization works.', async () => {
            const { statusCode, headers, body } = await request(app).get('/api?subject=COP&format=protobuf');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/octet-stream');
            const courseData = coursePB.CourseAPIResponseData.deserializeBinary(body);
            expect(courseData.getTotal().toString()).toMatch(/^\d+$/);
            const results = courseData.getResultsList();
            results.forEach((result) => {
                expect(result.getSubject()).toMatch(/COP/);
            });
        });
        test('/api: Error is handled my error handling middleware and serialized with protocol buffers.', async () => {
            const { statusCode, headers, body } = await request(app).get('/api?invalidquery=invalidvalue123&format=protobuf'); 
            const deserializedData = servicePB.Error.deserializeBinary(body);
            expect(statusCode).toBe(400);
            expect(headers['content-type']).toBe('application/octet-stream');
            expect(deserializedData.getError()).toBe('"invalidquery" is not allowed');
        });
    });
    describe('app: Testing / endpoint.', () => {
        test('/: Root request succeeds.', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
        });
        test('/: Unknown endpoint redirects to root.', async () => {
            const response = await request(app).get('/unknownendpoint123');
            expect(response.statusCode).toBe(302);
        });
        test('/: Request for /favicon.ico returns a 204 status code.', async () => {
            const response = await request(app).get('/favicon.ico');
            expect(response.statusCode).toBe(204);
        });
    });
    describe('app: Testing /status endpoint', () => {
        test('/status: Queryless request returns json data.', async () => {
            const { statusCode, headers, text } = await request(app).get('/status');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/json; charset=utf-8');
            const { version: appVersion, requestsFulfilled, uptime, dataAsOf } = JSON.parse(text);
            expect(appVersion).toBe(version);
            expect(requestsFulfilled.toString()).toMatch(/^\d+$/);
            expect(uptime.toString()).toMatch(/^\d+$/);
            expect(dataAsOf.toString()).toMatch(/^\d+$/);
        });
        test('/status: Query with format parameter correctly formats data.', async () => {
            const { statusCode, headers, text } = await request(app).get('/status?format=yaml');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('text/plain; charset=utf-8');
            const { version: appVersion, requestsFulfilled, uptime, dataAsOf } = yaml.parse(text);
            expect(appVersion).toBe(version);
            expect(requestsFulfilled.toString()).toMatch(/^\d+$/);
            expect(uptime.toString()).toMatch(/^\d+$/);
            expect(dataAsOf.toString()).toMatch(/^\d+$/);
        });
        test('/status: Protocol buffer serialization works.', async () => {
            const { statusCode, headers, body } = await request(app).get('/status?format=protobuf');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/octet-stream');
            const deserializedData = servicePB.Status.deserializeBinary(body);
            expect(deserializedData.getVersion()).toBe(version);
            expect(deserializedData.getRequestsfulfilled().toString()).toMatch(/^\d+$/);
            expect(deserializedData.getUptime().toString()).toMatch(/^\d+$/);
            expect(deserializedData.getDataasof().toString()).toMatch(/^\d+$/);
        });
    });
    server.close();    
});
