
module.exports = (error, _req, res, _next) => {
    console.log(error.stack);
    res.status(500).json({
        error: 'Oops something went wrong!',
    });
};
