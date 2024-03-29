const User = require('../models/userModel');
const AppError = require('../utills/appError');
const catchAsync = require('../utills/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ROUTE HANDLER for USERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // //1. catch Error if user tries to POSTs password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This action is not for passeord update. Please use /updatePassword',
        400
      )
    );
  }

  // 2. Filtered out unwanted field names that are not allowed to updated
  const filterBody = filterObj(req.body, 'name', 'email');
  console.log(filterBody);

  // 3. update Document
  // use findById and update because we are not dealing with password
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet define',
  });
};
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('NO USER WITH THIS ID', 404));
  }
  res.status(500).json({
    status: 'sucess',
    data: {
      user,
    },
  });
});
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet define',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet define',
  });
};
