const { errorHandler } = require('../middleware');

const getMockResponse = () => {
    return {
        statusCode: 0,
        body: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

describe('middleware: Test middleware functionality.', () => {
    test('middleware.errorHandler: Error handler correctly sets default response status and body.', () => {
        const mockError = {
            stack: 'Mock error stack trace.',
        };
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'json');
        errorHandler(mockError, {}, mockResponse);
        expect(responseStatusSpy).toHaveBeenCalledTimes(1);
        expect(responseBodySpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.statusCode).toBe(500);
        expect(mockResponse.body.error).toBe('Oops! Something went wrong.');
    });
    test('middleware.errorHandler: Error handler correctly sets specified response status and body.', () => {
        const mockError = {
            stack: 'Mock error stack trace.',
            statusCode: 404,
            message: 'Private Error!',
        };
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'json');
        errorHandler(mockError, {}, mockResponse);
        expect(responseStatusSpy).toHaveBeenCalledTimes(1);
        expect(responseBodySpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.statusCode).toBe(404);
        expect(mockResponse.body.error).toBe('Oops! Something went wrong.');
    });
    test('middleware.errorHandler: Error sets details for request errors.', () => {
        const mockError = {
            stack: 'Mock error stack trace.',
            statusCode: 400,
            message: 'Request Error!',
        };
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'json');
        errorHandler(mockError, {}, mockResponse);
        expect(responseStatusSpy).toHaveBeenCalledTimes(1);
        expect(responseBodySpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.statusCode).toBe(400);
        expect(mockResponse.body.error).toBe('Request Error!');
    });
});
