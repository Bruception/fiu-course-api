const { graphqlHTTP } = require('express-graphql');

const courseResolver = require('./resolvers/courseResolver');
const courseSchema = require('./schemas/courseSchema');

module.exports = graphqlHTTP({
    schema: courseSchema,
    rootValue: {
        data: courseResolver,
    },
    graphiql: true,
});
