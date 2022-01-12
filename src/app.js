const path = require('path');
const helmet = require('helmet');
const express = require('express');
const addApiRoutes = require('./api');
const graphqlApi = require('./graphql');
const { logger, getContextMiddleware, errorHandlers, addSwaggerMiddleware } = require('./middleware');

const PUBLIC_PATH = path.resolve(__dirname, './public');

const initializeApp = () => {
    const app = express();

    app.use(logger());
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [
                  '\'self\'',
                  '\'unsafe-inline\'',
                ],
                baseUri: ['\'self\''],
                blockAllMixedContent: [],
                fontSrc: ['\'self\'', 'https:', 'data:'],
                frameAncestors: ['\'self\''],
                imgSrc: ['\'self\'', 'data:'],
                objectSrc: ['\'none\''],
                scriptSrc: [
                  '\'self\'',
                  '\'unsafe-inline\'',
                  '\'unsafe-eval\'',
                ],
                upgradeInsecureRequests: [],
              },
        }
    }));
    app.use(getContextMiddleware());
    app.use(express.json());

    app.use('/graphql', graphqlApi);
    app.use('/', express.static(PUBLIC_PATH));
    addSwaggerMiddleware(app);

    addApiRoutes(app);

    app.get('/favicon.ico', (_req, res) => {
        return res.status(204).end();
    });

    app.get('*', (_req, res) => {
        return res.redirect('/');
    });

    app.use(errorHandlers.formattedErrorHandler);
    app.use(errorHandlers.fallbackErrorHandler);

    return app;
}

module.exports = initializeApp();
