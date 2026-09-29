import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  onEditTrip,
  onAddPacking,
  onTogglePacking,
  onDeletePacking
}) {
  const [packingDraft, setPackingDraft] = useState('');
  const [packingSubmitting, setPackingSubmitting] = useState(false);

  const total = Array.isArray(trip.places) ? trip.places.length : 0;
  const done = Array.isArray(trip.places) ? trip.places.filter((p) => p.done).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const spent = Number.isFinite(trip.spent) ? trip.spent : 0;
  const budget = Number.isFinite(trip.budget) ? trip.budget : 0;
  const remaining = Number.isFinite(trip.remaining) ? trip.remaining : 0;
  const spendPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const overBudget = budget > 0 && spent > budget;

  const categorySummary = useMemo(() => {
    return (trip.places || []).reduce((acc, place) => {
      const key = place.category || 'Other';
      acc[key] = (acc[key] || 0) + (Number(place.cost) || 0);
      return acc;
    }, {});
  }, [trip.places]);

  const sortedCategories = Object.entries(categorySummary).sort((a, b) => b[1] - a[1]);
  const packingPackedCount = Array.isArray(trip.packing) ? trip.packing.filter((item) => item.packed).length : 0;

  async function handlePackingSubmit(e) {
    e.preventDefault();
    if (!packingDraft.trim()) return;

    try {
      setPackingSubmitting(true);
      await onAddPacking({ item: packingDraft.trim() });
      setPackingDraft('');
    } finally {
      setPackingSubmitting(false);
    }
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(trip.title || 'Trip overview', 14, 20);
    doc.setFontSize(11);
    doc.text(`Destination: ${trip.destination || 'N/A'}`, 14, 30);
    doc.text(`Dates: ${formatFull(trip.startDate)} — ${formatFull(trip.endDate)}`, 14, 38);
    doc.text(`Companions: ${trip.companions?.length ? trip.companions.join(', ') : 'None'}`, 14, 46);
    doc.text(`Budget: ${formatMoney(budget, trip.currency)} | Spent: ${formatMoney(spent, trip.currency)}`, 14, 54);

    const rows = (trip.places || []).map((place) => [
      place.name,
      place.category || 'Other',
      formatMoney(place.cost || 0, trip.currency),
      place.done ? 'Yes' : 'No'
    ]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Cost', 'Visited']],
      body: rows,
      startY: 64,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 91, 95] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`${(trip.title || 'trip').toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

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
          <div className="passport__actions">
            <button className="passport__edit-link" onClick={() => onEditTrip(trip)}>
              Edit trip
            </button>
            <button className="btn btn--small btn--ghost" onClick={exportPdf}>
              Export PDF
            </button>
          </div>
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
              <div className={`budget__fill ${overBudget ? 'budget__fill--over' : ''}`} style={{ width: `${spendPct}%` }} />
            </div>
            <p className="budget__label">
              {overBudget
                ? `You're over the estimated budget by ${formatMoney(Math.abs(remaining), trip.currency)}`
                : `${spendPct}% of your budget used`}
            </p>
          </>
        )}
        {budget === 0 && <p className="budget__label">No budget set — add one via "Edit trip" to track your spend.</p>}
      </div>

      {sortedCategories.length > 0 && (
        <div className="category-summary">
          <h2 className="passport__section-heading">Spending by category</h2>
          {sortedCategories.map(([category, amount]) => {
            const percent = spent > 0 ? Math.max(4, Math.round((amount / spent) * 100)) : 0;
            return (
              <div key={category} className="category-summary__item">
                <div className="category-summary__meta">
                  <span>{category}</span>
                  <span>{formatMoney(amount, trip.currency)}</span>
                </div>
                <div className="budget__track category-summary__track">
                  <div className="budget__fill" style={{ width: `${percent}%` }} />
                </div>
                <small>{spent > 0 ? `${Math.round((amount / spent) * 100)}%` : '0%'}</small>
              </div>
            );
          })}
        </div>
      )}

      <div className="passport__progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="passport__progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="passport__progress-label">
        {total === 0 ? 'No places added yet' : `${done} of ${total} places visited (${pct}%)`}
      </p>

      <h2 className="passport__section-heading">Places to visit</h2>

      <ul className="place-list">
        {(trip.places || []).map((place) => (
          <PlaceRow
            key={place._id}
            place={place}
            currency={trip.currency}
            onToggle={(placeId, isDone) => onTogglePlace(placeId, isDone)}
            onUpdateCost={(placeId, cost) => onUpdatePlaceCost(placeId, cost)}
            onDelete={(placeId) => onDeletePlace(placeId)}
          />
        ))}
        {(trip.places || []).length === 0 && (
          <li className="place-list__empty">Nothing on the list yet — add your first stop below.</li>
        )}
      </ul>

      <AddPlaceForm onAdd={onAddPlace} />

      <div className="packing-list">
        <div className="packing-list__header">
          <h2 className="passport__section-heading">Packing list</h2>
          <span>
            {packingPackedCount} of {trip.packing?.length || 0} packed
          </span>
        </div>

        <form className="packing-form" onSubmit={handlePackingSubmit}>
          <input
            value={packingDraft}
            onChange={(e) => setPackingDraft(e.target.value)}
            placeholder="Add item to pack…"
          />
          <button type="submit" className="btn btn--small" disabled={packingSubmitting || !packingDraft.trim()}>
            {packingSubmitting ? 'Please wait…' : 'Add'}
          </button>
        </form>

        <ul className="packing-list__items">
          {(trip.packing || []).map((item) => (
            <li key={item._id} className={`packing-item ${item.packed ? 'packing-item--checked' : ''}`}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(item.packed)}
                  onChange={(e) => onTogglePacking(item._id, e.target.checked)}
                />
                <span>{item.item}</span>
              </label>
              <button type="button" className="place-row__delete" onClick={() => onDeletePacking(item._id)}>
                ✕
              </button>
            </li>
          ))}
          {(trip.packing || []).length === 0 && (
            <li className="place-list__empty">No packing items yet — add the essentials here.</li>
          )}
        </ul>
      </div>

      <button className="btn btn--danger-ghost" onClick={() => onDeleteTrip(trip._id)}>
        Delete this trip
      </button>
    </section>
  );
}
