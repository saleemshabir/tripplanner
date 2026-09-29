import { useState } from 'react';
import { formatMoney } from '../utils/format.js';

export default function PlaceRow({ place, currency, onToggle, onUpdateCost, onDelete }) {
  const [editingCost, setEditingCost] = useState(false);
  const [costDraft, setCostDraft] = useState(place.cost || 0);

  function commitCost() {
    setEditingCost(false);
    const value = Number(costDraft) || 0;
    if (value !== place.cost) onUpdateCost(place._id, value);
  }

  return (
    <li className={`place-row ${place.done ? 'place-row--done' : ''}`}>
      <button
        className="place-row__stamp"
        onClick={() => onToggle(place._id, !place.done)}
        title={place.done ? 'Mark as not visited' : 'Mark as visited'}
        aria-pressed={place.done}
      >
        {place.done ? '✓' : ''}
      </button>

      <span className="place-row__text">
        <span className="place-row__name">{place.name}</span>
        <span className="place-row__meta">
          {place.category && <span className="place-row__category">{place.category || 'Other'}</span>}
          {place.notes && <span className="place-row__notes">{place.notes}</span>}
        </span>
      </span>

      {editingCost ? (
        <input
          className="place-row__cost-input"
          type="number"
          min="0"
          autoFocus
          value={costDraft}
          onChange={(e) => setCostDraft(e.target.value)}
          onBlur={commitCost}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitCost();
            if (e.key === 'Escape') {
              setCostDraft(place.cost || 0);
              setEditingCost(false);
            }
          }}
        />
      ) : (
        <button
          className="place-row__cost"
          onClick={() => {
            setCostDraft(place.cost || 0);
            setEditingCost(true);
          }}
          title="Click to edit what you spent here"
        >
          {place.cost > 0 ? formatMoney(place.cost, currency) : '+ cost'}
        </button>
      )}

      <button className="place-row__delete" onClick={() => onDelete(place._id)} title="Remove place">
        ✕
      </button>
    </li>
  );
}
