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
  deletePlace,
  addPacking,
  togglePacking,
  deletePacking
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// Every trip route requires a logged-in user.
router.use(protect);

router.route('/').get(getTrips).post(createTrip);
router.route('/:id').get(getTrip).put(updateTrip).delete(deleteTrip);

router.route('/:id/places').post(addPlace);
router.route('/:id/places/:placeId').put(updatePlace).delete(deletePlace);

router.route('/:id/packing').post(addPacking);
router.route('/:id/packing/:itemId').put(togglePacking).delete(deletePacking);

module.exports = router;
