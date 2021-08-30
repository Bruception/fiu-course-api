const joi = require('joi');
const utils = require('../utils');
const servicePB = require('../protos/service_pb');

const getMockRequest = (format) => {
    return {
        body: {
            format
        },
    };    
}

const getMockResponse = ()  => {
    return {
        headers: {},
        data: null,
        send(data) {
            this.data = data;
        },
        setHeader(name, value) {
            this.headers[name] = value;
        },
    };
}

describe('utils: Test utility module functionality.', () => {
    test('utils.containsWord: Correctly determines if a word is present.', () => {
        const validString = 'This sentence contains the word contains.';
        expect(utils.containsWord(validString, 'contains')).toBe(true);
        expect(utils.containsWord(validString, 'boats')).toBe(false);
    });
    test('utils.error: Correctly returns error with defined properties.', () => {
        const error404 = utils.error('404!', 404);
        const error500 = utils.error('500!');
        expect(error404.message).toBe('404!');
        expect(error404.statusCode).toBe(404);
        expect(error500.message).toBe('500!');
        expect(error500.statusCode).toBe(500);
    });
    test('utils.validate: Correctly validates/invalidates data based on schema.', () => {
        const schema = joi.object({
            data: joi.number().required(),
        });
        const invalidData = {
            data: 'abc',
        };
        const validData = {
            data: 123
        };
        expect(() => utils.validate(schema, invalidData)).toThrow(Error);
        expect(utils.validate(schema, validData)).toEqual(validData);
    });
    test('utils.formatHandlerWrapper: Correctly creates wrapped handler.', () => {
        const dataToSerialize = {
            version: '1.0.0',
            uptime: 1337,
            dataAsOf: 12345,
            requestsFulfilled: 123,        
        };
        const handler = () => {
            return {
                data: dataToSerialize,
                formatOptions: {
                    getProtocolBuffer: (data) => {
                        const statusProto = new servicePB.Status();
                        statusProto.setVersion(data.version);
                        statusProto.setUptime(data.uptime);
                        statusProto.setDataasof(data.dataAsOf);
                        statusProto.setRequestsfulfilled(data.requestsFulfilled);
                        return statusProto;
                    },
                },
            };
        };
        const mockRequest = getMockRequest('protobuf');
        const mockResponse = getMockResponse();
        const responseSendSpy = jest.spyOn(mockResponse, 'send');
        const responseSetHeaderSpy = jest.spyOn(mockResponse, 'setHeader');
        const wrappedHandler = utils.formatHandlerWrapper(handler);
        wrappedHandler(mockRequest, mockResponse);
        expect(responseSendSpy).toHaveBeenCalledTimes(1);
        expect(responseSetHeaderSpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.headers['Content-Type']).toBe('application/octet-stream');
        const deserializedData = servicePB.Status.deserializeBinary(mockResponse.data);
        expect(deserializedData.getVersion()).toBe(dataToSerialize.version);
        expect(deserializedData.getUptime()).toBe(dataToSerialize.uptime);
        expect(deserializedData.getDataasof()).toBe(dataToSerialize.dataAsOf);
        expect(deserializedData.getRequestsfulfilled()).toBe(dataToSerialize.requestsFulfilled);
    });
    test('utils.formatHandlerWrapper: Correctly handles missing format options.', () => {
        const dataToSerialize = {
            data: 'test',
        };
        const handler = () => {
            return {
                data: dataToSerialize,
            }
        }
        const mockRequest = getMockRequest();
        const mockResponse = getMockResponse();
        const responseSendSpy = jest.spyOn(mockResponse, 'send');
        const responseSetHeaderSpy = jest.spyOn(mockResponse, 'setHeader');
        const wrappedHandler = utils.formatHandlerWrapper(handler);
        wrappedHandler(mockRequest, mockResponse);
        expect(responseSendSpy).toHaveBeenCalledTimes(1);
        expect(responseSetHeaderSpy).toHaveBeenCalledTimes(1);
        expect(mockResponse.headers['Content-Type']).toBe('application/json');
        expect(mockResponse.data).toBe('{\"data\":\"test\"}');
    });
    test('utils.formatHandlerWrapper: Correctly forwards formatting errors.', () => {
        const dataToSerialize = {
            data: 'test',
        };
        const handler = () => {
            return {
                data: dataToSerialize,
            }
        }
        const mockRequest = getMockRequest('invalid-format');
        const mockResponse = getMockResponse();
        const responseSendSpy = jest.spyOn(mockResponse, 'send');
        const responseSetHeaderSpy = jest.spyOn(mockResponse, 'setHeader');
        const nextStub = jest.fn();
        const wrappedHandler = utils.formatHandlerWrapper(handler);
        wrappedHandler(mockRequest, mockResponse, nextStub);
        expect(responseSendSpy).toHaveBeenCalledTimes(0);
        expect(responseSetHeaderSpy).toHaveBeenCalledTimes(0);
        expect(nextStub).toHaveBeenCalledTimes(1);
    });
});
