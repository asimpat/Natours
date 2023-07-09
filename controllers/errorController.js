const AppError = require('../utills/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErroeDB = (err) => {
  // using regular expressinon match text for the quotes
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate Field Value: ${value}. Please input another value`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError('Invalid Token. Please login in again', 401);

const handleExpiredError = () =>
  new AppError('Token has Expired, Login in again!!!', 401);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  // Operational: TRUSTED ERROR : SEND MESSAGE TO THE CLIENTS
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming error or unknown error: do not leak the error
  } else {
    // 1. LOG THE ERROR
    console.error('ERROR!!!!!', err);

    // 2. SEND A GENERIC MESSAGE
    res.status(500).json({
      status: 'error',
      message: 'Something went Wrong!!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErroeDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleExpiredError();

    sendErrorProd(error, res);
  }
};
