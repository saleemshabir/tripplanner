import { useCallback, useEffect, useState } from 'react';
import * as api from './api.js';
import AuthPage from './components/AuthPage.jsx';
import TripCard from './components/TripCard.jsx';
import TripForm from './components/TripForm.jsx';
import TripFilters from './components/TripFilters.jsx';
import TripDetail from './components/TripDetail.jsx';

const emptyFilters = { search: '', status: '', companion: '', sort: 'date' };

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [trips, setTrips] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState(emptyFilters);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // On first load, restore the session if a token is already saved.
  useEffect(() => {
    async function restore() {
      if (!api.getToken()) {
        setCheckingSession(false);
        return;
      }
      try {
        const me = await api.fetchMe();
        setUser(me);
      } catch {
        api.clearToken();
      } finally {
        setCheckingSession(false);
      }
    }
    restore();
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchTrips(filters);
      setTrips(data);
      setError('');
      // Keep the selection valid for the current result set.
      setSelectedId((current) => (data.some((t) => t._id === current) ? current : data[0]?._id ?? null));
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError('Could not reach the server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Reload whenever filters change, debounced so typing doesn't spam the API.
  useEffect(() => {
    if (!user) return undefined;
    const timer = setTimeout(loadTrips, 250);
    return () => clearTimeout(timer);
  }, [user, loadTrips]);

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    api.clearToken();
    setUser(null);
    setTrips([]);
    setSelectedId(null);
    setFilters(emptyFilters);
  }

  async function handleCreateTrip(form) {
    const trip = await api.createTrip(form);
    await loadTrips();
    setSelectedId(trip._id);
  }

  async function handleUpdateTrip(id, form) {
    await api.updateTrip(id, form);
    await loadTrips();
  }

  async function handleDeleteTrip(id) {
    if (!window.confirm('Delete this trip and all its places?')) return;
    await api.deleteTrip(id);
    await loadTrips();
  }

  function replaceTrip(updated) {
    setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }

  async function handleAddPlace(data) {
    replaceTrip(await api.addPlace(selectedId, data));
  }

  async function handleTogglePlace(placeId, done) {
    replaceTrip(await api.updatePlace(selectedId, placeId, { done }));
  }

  async function handleUpdatePlaceCost(placeId, cost) {
    replaceTrip(await api.updatePlace(selectedId, placeId, { cost }));
  }

  async function handleDeletePlace(placeId) {
    replaceTrip(await api.deletePlace(selectedId, placeId));
  }

  if (checkingSession) {
    return <div className="boot-screen">Loading…</div>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const selectedTrip = trips.find((t) => t._id === selectedId) || null;
  const filtersActive = filters.search || filters.status || filters.companion;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">✦</span>
          <div>
            <h1 className="sidebar__brand-title">Waypoint</h1>
            <p className="sidebar__brand-subtitle">{user.name}'s journal</p>
          </div>
        </div>

        <button className="btn btn--primary btn--full" onClick={() => setShowCreateForm(true)}>
          + Log a trip
        </button>

        <TripFilters filters={filters} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

        {loading && <p className="sidebar__status">Loading trips…</p>}
        {error && <p className="sidebar__status sidebar__status--error">{error}</p>}

        <ul className="trip-list">
          {trips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              active={trip._id === selectedId}
              onSelect={setSelectedId}
              onDelete={handleDeleteTrip}
            />
          ))}
          {!loading && trips.length === 0 && !error && (
            <p className="sidebar__status">
              {filtersActive ? 'No trips match those filters.' : 'No trips yet. Log your first one above.'}
            </p>
          )}
        </ul>

        <button className="sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="main">
        {selectedTrip ? (
          <TripDetail
            key={selectedTrip._id}
            trip={selectedTrip}
            onAddPlace={handleAddPlace}
            onTogglePlace={handleTogglePlace}
            onUpdatePlaceCost={handleUpdatePlaceCost}
            onDeletePlace={handleDeletePlace}
            onDeleteTrip={handleDeleteTrip}
            onEditTrip={setEditingTrip}
          />
        ) : (
          <div className="empty-state">
            <span className="empty-state__mark">✎</span>
            <h2>No trip selected</h2>
            <p>Log a new trip or pick one from the journal to start planning.</p>
          </div>
        )}
      </main>

      {showCreateForm && <TripForm onSubmit={handleCreateTrip} onClose={() => setShowCreateForm(false)} />}

      {editingTrip && (
        <TripForm
          trip={editingTrip}
          onSubmit={(form) => handleUpdateTrip(editingTrip._id, form)}
          onClose={() => setEditingTrip(null)}
        />
      )}
    </div>
  );
}
