const { version } = require('../../package.json');
const courseDataService = require('./course-data');
const servicePB = require('../protos/service_pb');

const APP_START_TIME = new Date().getTime();

module.exports = {
    getStatus(context) {
        const currentTime = new Date().getTime();
        const { requestNumber: requestsReceived } = context;

        return {
            version,
            uptime: currentTime - APP_START_TIME,
            dataAsOf: courseDataService.dataAsOf,
            requestsReceived,
        };
    },
    formatOptions: {
        getProtocolBuffer(data) {
            const statusProto = new servicePB.Status();
            statusProto.setVersion(data.version);
            statusProto.setUptime(data.uptime);
            statusProto.setDataasof(data.dataAsOf);
            statusProto.setRequestsreceived(data.requestsReceived);
            return statusProto;
        }
    },
};
