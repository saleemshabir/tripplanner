import { useState } from 'react';

const emptyForm = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
  currency: 'INR',
  companions: '',
  notes: ''
};

// Mongo returns full ISO datetimes; <input type="date"> needs YYYY-MM-DD.
function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function tripToForm(trip) {
  if (!trip) return emptyForm;
  return {
    title: trip.title,
    destination: trip.destination,
    startDate: toDateInputValue(trip.startDate),
    endDate: toDateInputValue(trip.endDate),
    budget: trip.budget || '',
    currency: trip.currency || 'INR',
    companions: (trip.companions || []).join(', '),
    notes: trip.notes || ''
  };
}

export default function TripForm({ trip, onSubmit, onClose }) {
  const isEditing = Boolean(trip);
  const [form, setForm] = useState(() => tripToForm(trip));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title || !form.destination || !form.startDate || !form.endDate) {
      setError('Please fill in title, destination and both dates.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('Return date cannot be before the departure date.');
      return;
    }
    if (form.budget !== '' && Number(form.budget) < 0) {
      setError('Budget cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ ...form, budget: Number(form.budget) || 0 });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isEditing ? 'Could not save your changes. Please try again.' : 'Could not save this trip. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 className="modal-card__heading">{isEditing ? 'Edit trip' : 'Log a new trip'}</h2>

        <label className="field">
          <span>Trip title</span>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Autumn in Kyoto" />
        </label>

        <label className="field">
          <span>Destination</span>
          <input name="destination" value={form.destination} onChange={handleChange} placeholder="Kyoto, Japan" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Departs</span>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
          </label>
          <label className="field">
            <span>Returns</span>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Estimated budget</span>
            <input
              type="number"
              min="0"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              placeholder="50000"
            />
          </label>
          <label className="field field--narrow">
            <span>Currency</span>
            <select name="currency" value={form.currency} onChange={handleChange}>
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="JPY">JPY ¥</option>
              <option value="AUD">AUD $</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Travel companions</span>
          <input
            name="companions"
            value={form.companions}
            onChange={handleChange}
            placeholder="Separate names with commas — e.g. Priya, Arjun"
          />
        </label>

        <label className="field">
          <span>Notes (optional)</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Visa reminders, flight numbers, booking refs..."
            rows={3}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-card__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Save trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
