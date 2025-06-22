const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;

    console.error(err.message);

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Une erreur s\'est produite sur le serveur',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
