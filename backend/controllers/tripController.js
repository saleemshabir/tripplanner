const Trip = require('../models/Trip');

// Turn "Alice, Bob" or ["Alice","Bob"] into a clean array.
function parseCompanions(value) {
  if (Array.isArray(value)) return value.map((c) => String(c).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((c) => c.trim()).filter(Boolean);
  return [];
}

// GET /api/trips
// Supports ?search=, ?status=upcoming|ongoing|past, ?companion=, ?sort=date|budget|title
async function getTrips(req, res) {
  try {
    const { search, status, companion, sort } = req.query;
    const query = { owner: req.user._id };

    if (search) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ title: rx }, { destination: rx }, { notes: rx }, { companions: rx }];
    }

    if (companion) {
      query.companions = new RegExp(companion.trim(), 'i');
    }

    const now = new Date();
    if (status === 'upcoming') query.startDate = { $gt: now };
    if (status === 'past') query.endDate = { $lt: now };
    if (status === 'ongoing') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const sortMap = {
      date: { startDate: 1 },
      budget: { budget: -1 },
      title: { title: 1 }
    };

    const trips = await Trip.find(query).sort(sortMap[sort] || sortMap.date);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load trips', error: err.message });
  }
}

// Fetch a trip only if it belongs to the requesting user.
async function findOwnedTrip(req) {
  return Trip.findOne({ _id: req.params.id, owner: req.user._id });
}

// GET /api/trips/:id
async function getTrip(req, res) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load trip', error: err.message });
  }
}

// POST /api/trips
async function createTrip(req, res) {
  try {
    const { title, destination, startDate, endDate, notes, budget, currency, companions } = req.body;

    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'title, destination, startDate and endDate are required' });
    }

    const trip = await Trip.create({
      owner: req.user._id,
      title,
      destination,
      startDate,
      endDate,
      notes,
      budget: Number(budget) || 0,
      currency: currency || 'INR',
      companions: parseCompanions(companions)
    });

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create trip', error: err.message });
  }
}

// PUT /api/trips/:id
async function updateTrip(req, res) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { title, destination, startDate, endDate, notes, budget, currency, companions } = req.body;

    if (title !== undefined) trip.title = title;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (notes !== undefined) trip.notes = notes;
    if (budget !== undefined) trip.budget = Number(budget) || 0;
    if (currency !== undefined) trip.currency = currency;
    if (companions !== undefined) trip.companions = parseCompanions(companions);

    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update trip', error: err.message });
  }
}

// DELETE /api/trips/:id
async function deleteTrip(req, res) {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete trip', error: err.message });
  }
}

// POST /api/trips/:id/places
async function addPlace(req, res) {
  try {
    const { name, notes, cost } = req.body;
    if (!name) return res.status(400).json({ message: 'Place name is required' });

    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.places.push({ name, notes, cost: Number(cost) || 0 });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add place', error: err.message });
  }
}

// PUT /api/trips/:id/places/:placeId
async function updatePlace(req, res) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const place = trip.places.id(req.params.placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });

    const { name, notes, done, cost } = req.body;
    if (name !== undefined) place.name = name;
    if (notes !== undefined) place.notes = notes;
    if (done !== undefined) place.done = done;
    if (cost !== undefined) place.cost = Number(cost) || 0;

    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update place', error: err.message });
  }
}

// DELETE /api/trips/:id/places/:placeId
async function deletePlace(req, res) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const place = trip.places.id(req.params.placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });

    place.deleteOne();
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete place', error: err.message });
  }
}

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addPlace,
  updatePlace,
  deletePlace
};
