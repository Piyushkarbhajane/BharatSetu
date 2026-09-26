const errorMiddleware = (err, req, res, next) => {

    const statusCode = err.statusCode || (err.name === "ValidationError" || err.name === "CastError" ? 400 : err.code === 11000 ? 409 : 500);
    const message = err.name === "ValidationError" ? Object.values(err.errors).map((item) => item.message).join(", ") : err.name === "CastError" ? "Invalid ID" : err.code === 11000 ? "A record with that value already exists" : err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;