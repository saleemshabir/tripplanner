import { useState } from 'react';

const CATEGORY_OPTIONS = ['Food', 'Stay', 'Transport', 'Sightseeing', 'Shopping', 'Other'];

export default function AddPlaceForm({ onAdd }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('Other');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onAdd({
        name: name.trim(),
        notes: notes.trim(),
        cost: Number(cost) || 0,
        category
      });
      setName('');
      setNotes('');
      setCost('');
      setCategory('Other');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-place-form" onSubmit={handleSubmit}>
      <input
        className="add-place-form__name"
        placeholder="Add a place to visit…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="add-place-form__notes"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="add-place-form__row">
        <input
          className="add-place-form__cost"
          type="number"
          min="0"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <select className="add-place-form__category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn--small" disabled={submitting || !name.trim()}>
        {submitting ? 'Please wait…' : 'Add'}
      </button>
    </form>
  );
}
