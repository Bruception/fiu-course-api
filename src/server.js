const app = require('./app');

/* istanbul ignore next */
const PORT = process.env.PORT || 8000;

/* istanbul ignore next */
const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}!`)
});

module.exports = server;
