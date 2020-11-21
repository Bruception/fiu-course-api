const { errorHandler } = require('../middleware');

describe('middleware: Test middleware functionality.', () => {
    test('middleware.errorHandler: Error handler correctly sets response status and body.', () => {
        const mockError = {
            stack: 'Mock error stack trace.',
        }
        const mockResponse = {
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
        }
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'json');
        errorHandler(mockError, {}, mockResponse);
        expect(responseStatusSpy).toHaveBeenCalledTimes(1);
        expect(responseBodySpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.statusCode).toBe(500);
        expect(mockResponse.body.error).toBe('Oops something went wrong!');
    });
});
