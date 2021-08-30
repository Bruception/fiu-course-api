const { errorHandler } = require('../middleware');

const getMockRequest = () => {
    return {
        query: {},
        body: {},
    };
}

const getMockResponse = () => {
    return {
        statusCode: 0,
        body: {},
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(body) {
            this.body = body;
            return this;
        },
        setHeader(header, data) {
            this.headers[header] = data;
        },
    };
}

describe('middleware: Test middleware functionality.', () => {
    test('middleware.errorHandler: Error handler correctly sets default response status and body.', () => {
        const mockError = {
            stack: 'Mock error stack trace.',
        };
        const mockRequest = getMockRequest();
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'send');
        errorHandler(mockError, mockRequest, mockResponse);
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
        const mockRequest = getMockRequest();
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'send');
        errorHandler(mockError, mockRequest, mockResponse);
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
        const mockRequest = getMockRequest();
        const mockResponse = getMockResponse();
        const responseStatusSpy = jest.spyOn(mockResponse, 'status');
        const responseBodySpy = jest.spyOn(mockResponse, 'send');
        errorHandler(mockError, mockRequest, mockResponse);
        expect(responseStatusSpy).toHaveBeenCalledTimes(1);
        expect(responseBodySpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.statusCode).toBe(400);
        expect(mockResponse.body.error).toBe('Request Error!');
    });
});
