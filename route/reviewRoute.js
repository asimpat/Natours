const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authControllers');

const router = express.Router();

router
  .route('/')
  .get(reviewController.allReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview 
  );

module.exports = router;
