const morgan = require('morgan');

const colors = {
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
};

const reset = '\x1b[0m';

const getStatusColor = (status) => {
  if (status >= 400) return colors.RED;
  if (status >= 300) return colors.CYAN;
  if (status >= 200) return colors.GREEN;
  return reset;
};

const customToken = (request, response) => {
  const { method, originalUrl, query } = request;
  const { statusCode, statusMessage } = response;
  const color = getStatusColor(statusCode);
  return `${method} '${originalUrl}' - ${color}${statusCode}: ${statusMessage}${reset}
    ${colors.GREEN}Info${reset}:\n\t Query: ${JSON.stringify(query)}`;
};

morgan.token('custom', customToken);
morgan.format('dev-log', ':custom\n :response-time ms\n');

module.exports = () => morgan('dev-log');
