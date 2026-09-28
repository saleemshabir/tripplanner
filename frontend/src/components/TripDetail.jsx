import PlaceRow from './PlaceRow.jsx';
import AddPlaceForm from './AddPlaceForm.jsx';
import { formatMoney } from '../utils/format.js';

function formatFull(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function tripDurationDays(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export default function TripDetail({
  trip,
  onAddPlace,
  onTogglePlace,
  onUpdatePlaceCost,
  onDeletePlace,
  onDeleteTrip,
  onEditTrip
}) {
  const total = trip.places.length;
  const done = trip.places.filter((p) => p.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const spent = trip.places.reduce((sum, p) => sum + (p.cost || 0), 0);
  const budget = trip.budget || 0;
  const remaining = budget - spent;
  const spendPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const overBudget = budget > 0 && spent > budget;

  return (
    <section className="passport">
      <header className="passport__header">
        <div>
          <p className="passport__eyebrow">Destination</p>
          <h1 className="passport__title">{trip.destination}</h1>
          <p className="passport__subtitle">{trip.title}</p>
        </div>
        <div className="passport__header-right">
          <div className="passport__stamp-mark" aria-hidden="true">
            <span>{tripDurationDays(trip.startDate, trip.endDate)}</span>
            <small>days</small>
          </div>
          <button className="passport__edit-link" onClick={() => onEditTrip(trip)}>
            Edit trip
          </button>
        </div>
      </header>

      <div className="passport__meta">
        <div>
          <span className="passport__meta-label">Departs</span>
          <span className="passport__meta-value">{formatFull(trip.startDate)}</span>
        </div>
        <div className="passport__meta-divider" aria-hidden="true">✈</div>
        <div>
          <span className="passport__meta-label">Returns</span>
          <span className="passport__meta-value">{formatFull(trip.endDate)}</span>
        </div>
      </div>

      {trip.companions?.length > 0 && (
        <div className="companions">
          <span className="companions__label">Travelling with</span>
          <span className="companions__chips">
            {trip.companions.map((name) => (
              <span className="companions__chip" key={name}>
                {name}
              </span>
            ))}
          </span>
        </div>
      )}

      {trip.notes && <p className="passport__notes">{trip.notes}</p>}

      {/* ---- Budget summary ---- */}
      <div className="budget">
        <div className="budget__figures">
          <div className="budget__figure">
            <span className="budget__figure-label">Estimated budget</span>
            <span className="budget__figure-value">{formatMoney(budget, trip.currency)}</span>
          </div>
          <div className="budget__figure">
            <span className="budget__figure-label">Spent so far</span>
            <span className="budget__figure-value">{formatMoney(spent, trip.currency)}</span>
          </div>
          <div className="budget__figure">
            <span className="budget__figure-label">{remaining < 0 ? 'Over by' : 'Remaining'}</span>
            <span className={`budget__figure-value ${overBudget ? 'budget__figure-value--over' : ''}`}>
              {formatMoney(Math.abs(remaining), trip.currency)}
            </span>
          </div>
        </div>

        {budget > 0 && (
          <>
            <div className="budget__track">
              <div
                className={`budget__fill ${overBudget ? 'budget__fill--over' : ''}`}
                style={{ width: `${spendPct}%` }}
              />
            </div>
            <p className="budget__label">
              {overBudget
                ? `You're over the estimated budget by ${formatMoney(Math.abs(remaining), trip.currency)}`
                : `${spendPct}% of your budget used`}
            </p>
          </>
        )}
        {budget === 0 && (
          <p className="budget__label">No budget set — add one via "Edit trip" to track your spend.</p>
        )}
      </div>

      {/* ---- Places ---- */}
      <div className="passport__progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="passport__progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="passport__progress-label">
        {total === 0 ? 'No places added yet' : `${done} of ${total} places visited (${pct}%)`}
      </p>

      <h2 className="passport__section-heading">Places to visit</h2>

      <ul className="place-list">
        {trip.places.map((place) => (
          <PlaceRow
            key={place._id}
            place={place}
            currency={trip.currency}
            onToggle={(placeId, isDone) => onTogglePlace(placeId, isDone)}
            onUpdateCost={(placeId, cost) => onUpdatePlaceCost(placeId, cost)}
            onDelete={(placeId) => onDeletePlace(placeId)}
          />
        ))}
        {trip.places.length === 0 && (
          <li className="place-list__empty">Nothing on the list yet — add your first stop below.</li>
        )}
      </ul>

      <AddPlaceForm onAdd={onAddPlace} />

      <button className="btn btn--danger-ghost" onClick={() => onDeleteTrip(trip._id)}>
        Delete this trip
      </button>
    </section>
  );
}
