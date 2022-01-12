const _ = require('lodash');
const request = require('supertest');

const { app } = require('../app');

const courseQuery = `
{
    courses(subject: "AST") {
        name
        description
    }
}
`

const statusQuery = `
{
    status {
        dataAsOf
    }
}
`

describe('graphql: Test graphql API', () => {
    test('graphql: Course resolver.', async () => {
        const { statusCode, text } = await request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send({
                query: courseQuery,
            });

        const { data } = JSON.parse(text);

        expect(statusCode).toBe(200);
        expect(_.keys(data)).toStrictEqual(['courses']);
        data.courses.forEach((course) => {
            expect(_.keys(course)).toStrictEqual(['name', 'description']);
        });
    });

    test('graphql: Status resolver.', async () => {
        const { statusCode, text } = await request(app)
        .post('/graphql')
        .set('content-type', 'application/json')
        .send({
            query: statusQuery,
        });

        const { data } = JSON.parse(text);
        
        expect(statusCode).toBe(200);
        expect(_.keys(data)).toStrictEqual(['status']);
        expect(_.keys(data.status)).toStrictEqual(['dataAsOf']);
        expect(data.status.dataAsOf.toString()).toMatch(/^\d+$/)
    });
});
