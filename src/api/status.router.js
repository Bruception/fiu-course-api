const express = require('express');
const { version } = require('../../package.json');
const { formatHandlerWrapper } = require('../utils');
const { courseDataService } = require('../services');
const servicePB = require('../protos/service_pb');

const APP_START_TIME = new Date().getTime();

const statusRouter = express.Router();

statusRouter.get('/', formatHandlerWrapper(
    (req) => {
        const { requestNumber: requestsReceived } = req.context;
        const currentTime = new Date().getTime();
        const statusData = {
            version,
            uptime: currentTime - APP_START_TIME,
            dataAsOf: courseDataService.dataAsOf,
            requestsReceived,
        };
        return {
            data: statusData,
            formatOptions: {
                getProtocolBuffer: (data) => {
                    const statusProto = new servicePB.Status();
                    statusProto.setVersion(data.version);
                    statusProto.setUptime(data.uptime);
                    statusProto.setDataasof(data.dataAsOf);
                    statusProto.setRequestsreceived(data.requestsReceived);
                    return statusProto;
                }
            },
        };
    }
));

module.exports = statusRouter;
