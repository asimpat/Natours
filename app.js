const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./route/tourRoutes');
const userRouter = require('./route/userRoutes');
const reviewRouter = require('./route/reviewRoute');
const AppError = require('./utills/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

////////////////////////////////////////////////////////
// GLOBAL MIDDLEWARE
// Set Security HTTP request
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limitting request from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  Message: 'Too many request for this IP. Please try again in one hour',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NOSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS(cross side scripting attacks)
app.use(xss());

// prevent parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'maxGroupSize',
      'price',
    ],
  })
);

// how to serve static files form the folders the are in(to access files from the frontend)
app.use(express.static(`${__dirname}/public`));

// A test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date();
  // console.log(req.headers);
  next();
});
////////////////////////////////////////////////////////

// // MOUNTING THE ROUTER
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // CREATE ERROR
  const err = new AppError(
    `can't find ${req.originalUrl} on this server!`,
    404
  );

  next(err);
});

app.use(globalErrorHandler);

// SERVER
module.exports = app;
