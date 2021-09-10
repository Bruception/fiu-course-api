const yaml = require('yaml');
const request = require('supertest');

const { app, server } = require('../app');
const { version } = require('../../package.json');
const coursePB = require('../protos/course_pb');
const servicePB = require('../protos/service_pb');
const courseData = require('../data/course-data.json');

describe('app: Testing endpoints.', () => {
    describe('app: Testing /api/courses endpoint.', () => {
        test('/api/courses: Queryless request returns all data.', async () => {
            const { statusCode, text } = await request(app).get('/api/courses');
            expect(statusCode).toBe(200);
            expect(JSON.parse(text).total).toBe(courseData.data.length);
        });
        test('/api/courses: Request with subject query returns all related data.', async () => {
            const response = await request(app).get('/api/courses?subject=COP&isLab=true&units=0.00&code=2');
            const { total, results } = JSON.parse(response.text);
            expect(response.statusCode).toBe(200);
            expect(total).toBe(results.length);
            expect(results).toBeTruthy();
        });
        test('/api/courses: Request with invalid query is handled properly.', async () => {
            const response = await request(app).get('/api/courses?invalidquery=invalidvalue123');
            const { error } = response.body;
            expect(response.statusCode).toBe(400);
            expect(error).toBe('"invalidquery" is not allowed');
        });
        test('/api/courses: Protocol buffer serialization works.', async () => {
            const {
                statusCode,
                headers,
                body
            } = await request(app)
                .get('/api/courses?subject=COP')
                .set('accept', 'application/octet-stream');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/octet-stream');
            const courseData = coursePB.CourseAPIResponseData.deserializeBinary(body);
            expect(courseData.getTotal().toString()).toMatch(/^\d+$/);
            const results = courseData.getResultsList();
            results.forEach((result) => {
                expect(result.getSubject()).toMatch(/COP/);
            });
        });
        test('/api/courses: Error is handled by error handling middleware and serialized with protocol buffers.', async () => {
            const {
                statusCode,
                headers,
                body
            } = await request(app)
                .get('/api/courses?invalidquery=invalidvalue123')
                .set('accept', 'application/octet-stream');
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
    describe('app: Testing /api/status endpoint', () => {
        test('/api/status: Queryless request returns json data.', async () => {
            const { statusCode, headers, text } = await request(app).get('/api/status');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/json; charset=utf-8');
            const { version: appVersion, requestsReceived, uptime, dataAsOf } = JSON.parse(text);
            expect(appVersion).toBe(version);
            expect(requestsReceived.toString()).toMatch(/^\d+$/);
            expect(uptime.toString()).toMatch(/^\d+$/);
            expect(dataAsOf.toString()).toMatch(/^\d+$/);
        });
        test('/api/status: Query with format parameter correctly formats data.', async () => {
            const {
                statusCode,
                headers,
                text
            } = await request(app)
                .get('/api/status')
                .set('accept', 'application/x-yaml');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/x-yaml; charset=utf-8');
            const { version: appVersion, requestsReceived, uptime, dataAsOf } = yaml.parse(text);
            expect(appVersion).toBe(version);
            expect(requestsReceived.toString()).toMatch(/^\d+$/);
            expect(uptime.toString()).toMatch(/^\d+$/);
            expect(dataAsOf.toString()).toMatch(/^\d+$/);
        });
        test('/api/status: Protocol buffer serialization works.', async () => {
            const {
                statusCode,
                headers,
                body
            } = await request(app)
                .get('/api/status')
                .set('Accept', 'application/octet-stream');
            expect(statusCode).toBe(200);
            expect(headers['content-type']).toBe('application/octet-stream');
            const deserializedData = servicePB.Status.deserializeBinary(body);
            expect(deserializedData.getVersion()).toBe(version);
            expect(deserializedData.getRequestsreceived().toString()).toMatch(/^\d+$/);
            expect(deserializedData.getUptime().toString()).toMatch(/^\d+$/);
            expect(deserializedData.getDataasof().toString()).toMatch(/^\d+$/);
        });
    });
    server.close();
});
