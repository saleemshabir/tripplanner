const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addPlace,
  updatePlace,
  deletePlace
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// Every trip route requires a logged-in user.
router.use(protect);

router.route('/').get(getTrips).post(createTrip);
router.route('/:id').get(getTrip).put(updateTrip).delete(deleteTrip);

router.route('/:id/places').post(addPlace);
router.route('/:id/places/:placeId').put(updatePlace).delete(deletePlace);

module.exports = router;
