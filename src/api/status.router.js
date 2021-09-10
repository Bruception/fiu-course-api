const express = require('express');
const { version } = require('../../package.json');
const { formatHandlerWrapper } = require('../utils');
const { courseDataService } = require('../services');
const servicePB = require('../protos/service_pb');

const APP_START_TIME = new Date().getTime();

const statusRouter = express.Router();

const requestsFulfilled = 0;

statusRouter.get('/', formatHandlerWrapper(
    () => {
        const currentTime = new Date().getTime();
        const statusData = {
            version,
            uptime: currentTime - APP_START_TIME,
            dataAsOf: courseDataService.dataAsOf,
            requestsFulfilled,
        };
        return {
            data: statusData,
            formatOptions: {
                getProtocolBuffer: (data) => {
                    const statusProto = new servicePB.Status();
                    statusProto.setVersion(data.version);
                    statusProto.setUptime(data.uptime);
                    statusProto.setDataasof(data.dataAsOf);
                    statusProto.setRequestsfulfilled(data.requestsFulfilled);
                    return statusProto;
                }
            },
        };
    }
));

module.exports = statusRouter;
