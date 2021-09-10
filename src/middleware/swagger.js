const swaggerUi = require('swagger-ui-express');
const openApiDocument = require('../openapi.json');

const SWAGGER_UI_PATH = '/new-documentation';

const SWAGGER_UI_OPTIONS = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FIU Course API Documentation'
};

const addSwaggerMiddleware = (app) => {
    const swaggerUiMiddleware = swaggerUi.setup(openApiDocument, SWAGGER_UI_OPTIONS);
    app.use(SWAGGER_UI_PATH, swaggerUi.serve, swaggerUiMiddleware);
}

module.exports = addSwaggerMiddleware;
