const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },
    cost: { type: Number, default: 0, min: 0 },
    done: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    companions: { type: [String], default: [] },
    notes: { type: String, trim: true, default: '' },
    places: { type: [placeSchema], default: [] }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Total actually spent across all places on this trip.
tripSchema.virtual('spent').get(function spent() {
  return this.places.reduce((sum, place) => sum + (place.cost || 0), 0);
});

// What's left of the estimated budget.
tripSchema.virtual('remaining').get(function remaining() {
  return (this.budget || 0) - this.spent;
});

module.exports = mongoose.model('Trip', tripSchema);
