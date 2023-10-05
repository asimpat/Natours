const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utills/catchAsync');
const AppError = require('../utills/appError');
const sendEmail = require('../utills/email');

const signtoken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signtoken(user._id); 

  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === ' production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = signtoken(newUser._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === ' production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove the password from the output
  newUser.password = undefined;
  res.status(201).json({
    status: 'success',
    token,
    data: {
      newUser,
    },
  });

  // createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and Password', 400));
  }

  // 2. check if user exist and password is correct(by comparing)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Credentials. Try Again', 401));
  }
  // 3. if everything is ok, send the jwt to client
  const token = signtoken(user._id);
  res.status(201).json({
    status: 'success',
    token,
    message: `${user.email} successfully logged in`,
  });

  // createSendToken(user.email, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1.  GET THE TOKEN AND CHECK IF IT EXIST

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('you are not logged in!! Please log in to get access', 401)
    );
  }

  // 2. VERIFICATION OF THE TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. CHECK IF USER EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token NO longer exist', 401)
    );
  }

  // 4. CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (!currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed Password. Please login again!!!')
    );
  }

  //   GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }

  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is NO user with email address', 404));
  }

  // 2. Generate a random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3. send the token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your Password? Click the link and input your NEW password
   and ConfirmPassword to: ${resetURL}. \n If you didn't forget Password, 
   please ignore this message`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your password rest Token. Valid for 10min`,
      message,
    });
    createSendToken(200, res);
  } catch (err) {
    // reset the token and the expires from the database
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error Sending the email. Try again', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. GET USER BASED ON TOKEN
  // encrypt the token to be hased like that of the database
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2. IF TOKEN HAS NOT EXPIRED AND THERE IS USER. SET NEW PASSWORD
  if (!user) {
    return next(
      new AppError(
        'Session has expired or Token is invalid. Reset Password again',
        400
      )
    );
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. UPDATE THE CHANGEDPASSWORDAT property for the user
  // 4. log the user in. send JWT

  createSendToken(user.email, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. GET THE USER FROM THE COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  // 2. CHECK IF THE POSTED PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Currect Password Incorrect. Try again!!', 404));
  }

  // 3. IF PASSWORD IS CORRECT, THEN UPDATE THE PASSWORD
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // 4. LOG THE USER IN WITH THE JWT(haveing the new password that was updated)
  createSendToken(`${user.email} successfully update Password`, 200, res);
});
