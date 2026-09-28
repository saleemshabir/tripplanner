import { useState } from 'react';

export default function AddPlaceForm({ onAdd }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onAdd({ name: name.trim(), notes: notes.trim(), cost: Number(cost) || 0 });
      setName('');
      setNotes('');
      setCost('');
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
      <input
        className="add-place-form__cost"
        type="number"
        min="0"
        placeholder="Cost"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
      />
      <button type="submit" className="btn btn--small" disabled={submitting || !name.trim()}>
        Add
      </button>
    </form>
  );
}
