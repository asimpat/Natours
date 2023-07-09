const express = require('express');
const tourCotroller = require('../controllers/tourControllers');
const authController = require('../controllers/authControllers');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// param middleware
// router.param('id', tourCotroller.checkId);
router
  .route('/top-5-cheap')
  .get(tourCotroller.aliasTopTours, tourCotroller.getAllTours);

router.route('/tour-stats').get(tourCotroller.getTourStats);
router.route('/monthly-plan/:year').get(tourCotroller.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourCotroller.getAllTours)
  .post(tourCotroller.createTour);
router
  .route('/:id')
  .get(tourCotroller.getTourById)
  .patch(tourCotroller.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourCotroller.deleteTour
  );

router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
