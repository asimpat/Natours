const { default: mongoose } = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'the review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },

    tourReview: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },

    userReview: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a User'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tourReview',
  //   select: 'name',
  // }).populate({
  //   path: 'userReview',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'userReview',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
