const morgan = require('morgan');

const colors = {
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
}

const reset = '\x1b[0m';

const getStatusColor = (status) => {
  if (status >= 400) return colors.RED;
  if (status >= 300) return colors.CYAN;
  return colors.GREEN;
}

const customToken = (request, response) => {
  const { method, originalUrl, query, body } = request;
  const { statusCode, statusMessage } = response;
  const color = getStatusColor(statusCode);
  const queryAsString = JSON.stringify(query);
  const bodyAsString = JSON.stringify(body);
  return `${method} '${originalUrl}' - ${color}${statusCode}: ${statusMessage}${reset}
    ${colors.GREEN}Info${reset}:\n\tQuery: ${queryAsString}\n\tBody: ${bodyAsString}`;
}

morgan.token('custom', customToken);
morgan.format('dev-log', ':custom\n :response-time ms\n');

module.exports = () => morgan('dev-log');
