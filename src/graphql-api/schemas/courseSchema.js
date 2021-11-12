const { buildSchema } = require('graphql');

const courseSchema = buildSchema(`
    type Course {
        subject: String
        code: String
        name: String
        units: String
        description: String
    }

    type Query {
        data: String
    }
`);

module.exports = courseSchema;
