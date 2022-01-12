const path = require('path')
const { buildASTSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
const { mergeTypeDefs } = require('@graphql-tools/merge')
const { loadFilesSync } = require('@graphql-tools/load-files')
const { courseDataService, statusService } = require('../services');

const documentNode = mergeTypeDefs(loadFilesSync(path.join(__dirname, './types')));
const schema = buildASTSchema(documentNode);

const resolvers = {
    courses: (args) => {
        return courseDataService.queryBy(args);
    },
    status: (_, { context }) => {
        return statusService.getStatus(context);
    }
};

module.exports = graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
});
