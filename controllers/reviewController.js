const Review = require('../models/reviewModel');
const catchAsync = require('../utills/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

exports.allReviews = catchAsync(async (req, res, next) => {
  const allReviews = await Review.find();

  res.status(200).json({
    status: 'success',
    length: allReviews.length,
    data: {
      allReviews,
    },
  });
});
