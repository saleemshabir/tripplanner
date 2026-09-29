import { formatMoney } from '../utils/format.js';

function formatRange(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(start).toLocaleDateString(undefined, opts);
  const e = new Date(end).toLocaleDateString(undefined, { ...opts, year: 'numeric' });
  return `${s} — ${e}`;
}

export default function TripCard({ trip, active, onSelect, onDelete }) {
  const total = Array.isArray(trip.places) ? trip.places.length : 0;
  const done = Array.isArray(trip.places) ? trip.places.filter((p) => p.done).length : 0;
  const spent = Number.isFinite(trip.spent) ? trip.spent : 0;
  const remaining = Number.isFinite(trip.remaining) ? trip.remaining : 0;
  const overBudget = (trip.budget || 0) > 0 && remaining < 0;

  return (
    <li className={`trip-card ${active ? 'trip-card--active' : ''}`}>
      <button className="trip-card__main" onClick={() => onSelect(trip._id)}>
        <span className="trip-card__pin" aria-hidden="true">✦</span>
        <span className="trip-card__body">
          <span className="trip-card__title">{trip.title}</span>
          <span className="trip-card__destination">{trip.destination}</span>
          <span className="trip-card__dates">{formatRange(trip.startDate, trip.endDate)}</span>

          <span className="trip-card__tags">
            {total > 0 && (
              <span className="trip-card__progress">
                {done}/{total} visited
              </span>
            )}
            {(trip.budget || 0) > 0 && (
              <span className={`trip-card__budget ${overBudget ? 'trip-card__budget--over' : ''}`}>
                {formatMoney(spent, trip.currency)} / {formatMoney(trip.budget, trip.currency)}
              </span>
            )}
          </span>

          {trip.companions?.length > 0 && (
            <span className="trip-card__companions">with {trip.companions.join(', ')}</span>
          )}
        </span>
      </button>
      <button className="trip-card__delete" title="Delete trip" onClick={() => onDelete(trip._id)}>
        ✕
      </button>
    </li>
  );
}
