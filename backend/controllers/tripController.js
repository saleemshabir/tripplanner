const Trip = require('../models/Trip');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidDateInput(value) {
  if (value === undefined || value === null || value === '') return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    return (
      normalized.getUTCFullYear() === year &&
      normalized.getUTCMonth() + 1 === month &&
      normalized.getUTCDate() === day
    );
  }

  return true;
}

function validateTripInput({ title, destination, startDate, endDate, budget }) {
  if (typeof title !== 'string' || !title.trim()) return 'Trip title is required';
  if (typeof destination !== 'string' || !destination.trim()) return 'Destination is required';
  if (!isValidDateInput(startDate)) return 'Start date must be a valid date';
  if (!isValidDateInput(endDate)) return 'End date must be a valid date';
  if (new Date(endDate) < new Date(startDate)) return 'End date cannot be before start date';

  if (budget !== undefined && budget !== null && budget !== '') {
    const amount = Number(budget);
    if (!Number.isFinite(amount)) return 'Budget must be a valid number';
    if (amount < 0) return 'Budget cannot be negative';
  }

  return null;
}

function parseCompanions(value) {
  if (Array.isArray(value)) return value.map((c) => String(c).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((c) => c.trim()).filter(Boolean);
  return [];
}

async function getTrips(req, res, next) {
  try {
    const { search, status, companion, sort, page = 1, limit = 10 } = req.query;
    const query = { owner: req.user._id };

    const searchTerm = typeof search === 'string' ? search.trim() : '';
    const companionTerm = typeof companion === 'string' ? companion.trim() : '';

    if (searchTerm) {
      const rx = new RegExp(escapeRegExp(searchTerm), 'i');
      query.$or = [{ title: rx }, { destination: rx }, { notes: rx }, { companions: rx }];
    }

    if (companionTerm) {
      query.companions = new RegExp(escapeRegExp(companionTerm), 'i');
    }

    const now = new Date();
    if (status === 'upcoming') query.startDate = { $gt: now };
    if (status === 'past') query.endDate = { $lt: now };
    if (status === 'ongoing') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 10);
    const skip = (pageNumber - 1) * pageSize;

    const sortMap = {
      date: { startDate: 1 },
      budget: { budget: -1 },
      title: { title: 1 }
    };

    const [trips, total] = await Promise.all([
      Trip.find(query).sort(sortMap[sort] || sortMap.date).skip(skip).limit(pageSize),
      Trip.countDocuments(query)
    ]);

    res.json({
      trips,
      page: pageNumber,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      total
    });
  } catch (err) {
    next(err);
  }
}

async function findOwnedTrip(req) {
  return Trip.findOne({ _id: req.params.id, owner: req.user._id });
}

async function getTrip(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

async function createTrip(req, res, next) {
  try {
    const { title, destination, startDate, endDate, notes, budget, currency, companions } = req.body || {};
    const validationError = validateTripInput({ title, destination, startDate, endDate, budget });
    if (validationError) return res.status(400).json({ message: validationError });

    const trip = await Trip.create({
      owner: req.user._id,
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      notes: notes || '',
      budget: Number(budget) || 0,
      currency: currency || 'INR',
      companions: parseCompanions(companions)
    });

    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { title, destination, startDate, endDate, notes, budget, currency, companions } = req.body || {};

    const validationError = validateTripInput({
      title: title === undefined ? trip.title : title,
      destination: destination === undefined ? trip.destination : destination,
      startDate: startDate === undefined ? trip.startDate : startDate,
      endDate: endDate === undefined ? trip.endDate : endDate,
      budget: budget === undefined ? trip.budget : budget
    });
    if (validationError) return res.status(400).json({ message: validationError });

    if (title !== undefined) trip.title = title.trim();
    if (destination !== undefined) trip.destination = destination.trim();
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (notes !== undefined) trip.notes = notes || '';
    if (budget !== undefined) trip.budget = Number(budget) || 0;
    if (currency !== undefined) trip.currency = currency || 'INR';
    if (companions !== undefined) trip.companions = parseCompanions(companions);

    await trip.save();
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

async function deleteTrip(req, res, next) {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    next(err);
  }
}

async function addPlace(req, res, next) {
  try {
    const { name, notes, cost, category } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Place name is required' });

    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.places.push({
      name: String(name).trim(),
      notes: notes || '',
      cost: Number(cost) || 0,
      category: category || 'Other'
    });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const place = trip.places.id(req.params.placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });

    const { name, notes, done, cost, category } = req.body;
    if (name !== undefined) place.name = String(name).trim();
    if (notes !== undefined) place.notes = notes || '';
    if (done !== undefined) place.done = done;
    if (cost !== undefined) place.cost = Number(cost) || 0;
    if (category !== undefined) place.category = category || 'Other';

    await trip.save();
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

async function deletePlace(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const place = trip.places.id(req.params.placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });

    place.deleteOne();
    await trip.save();
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

async function addPacking(req, res, next) {
  try {
    const { item } = req.body || {};
    if (typeof item !== 'string' || !item.trim()) {
      return res.status(400).json({ message: 'Packing item is required' });
    }

    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.packing.push({ item: item.trim(), packed: false });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

async function togglePacking(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const packingItem = trip.packing.id(req.params.itemId);
    if (!packingItem) return res.status(404).json({ message: 'Packing item not found' });

    if (req.body && req.body.packed !== undefined) packingItem.packed = Boolean(req.body.packed);
    await trip.save();
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

async function deletePacking(req, res, next) {
  try {
    const trip = await findOwnedTrip(req);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const packingItem = trip.packing.id(req.params.itemId);
    if (!packingItem) return res.status(404).json({ message: 'Packing item not found' });

    packingItem.deleteOne();
    await trip.save();
    res.json(trip);
  } catch (err) {
    next(err);
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
  deletePlace,
  addPacking,
  togglePacking,
  deletePacking
};
