const AppError = require("./../utils/appError");

//DEVELOPMENT ERROR HANDLER
const devErrors = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack
  });
};

//PRODUCTION ERROR HANDLER
const prodErrors = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong...!!!"
    });
  }
};

//DB WRONGFIELD ERRORS
const handelCastError = err => {
  const message = `invalid ${err.path} for ${err.value}`;
  return new AppError(message, 400);
};

//DB VALIDATION ERRORS
const handelValidationError = err => {
  const errors = Object.values(err.errors).map(e => e.message);
  const msg = `Invalid ${errors.join(". ")}`;

  return new AppError(msg, 400);
};

//DB CREATING DUPLICATE ERRORS
const handelDuplicate = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field ${value}`;

  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV == "development") {
    devErrors(err, res);
  } else if (process.env.NODE_ENV == "production") {
    const error = { ...err };

    if (error.name == "CastError") {
      error = handelCastError(error);
    }
    if (error.name == "ValidationError") {
      error = handelValidationError(error);
    }
    if (error.code == 1100) {
      error = handelDuplicate(error);
    }

    prodErrors(error, res);
  }
};
