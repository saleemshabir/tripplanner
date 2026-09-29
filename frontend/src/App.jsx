import { useCallback, useEffect, useState } from 'react';
import * as api from './api.js';
import AuthPage from './components/AuthPage.jsx';
import TripCard from './components/TripCard.jsx';
import TripForm from './components/TripForm.jsx';
import TripFilters from './components/TripFilters.jsx';
import TripDetail from './components/TripDetail.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';

const emptyFilters = { search: '', status: '', companion: '', sort: 'date' };

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [trips, setTrips] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState(emptyFilters);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('waypoint-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const notify = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('waypoint-theme', theme);
  }, [theme]);

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

  const handleLogout = useCallback(() => {
    api.clearToken();
    setUser(null);
    setTrips([]);
    setSelectedId(null);
    setPage(1);
    setTotalPages(1);
    setHasMore(false);
    setFilters(emptyFilters);
  }, []);

  const loadTrips = useCallback(
    async ({ append = false, reset = false } = {}) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError('');

        const requestPage = reset ? 1 : append ? page + 1 : 1;
        const data = await api.fetchTrips(filters, requestPage, 10);
        const nextTrips = data.trips || [];

        setTrips((current) => {
          if (append) {
            const seen = new Set(current.map((trip) => trip._id));
            return [...current, ...nextTrips.filter((trip) => !seen.has(trip._id))];
          }
          return nextTrips;
        });

        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setHasMore((data.page || 1) < (data.totalPages || 1));
        setSelectedId((current) => {
          if (!current && nextTrips[0]) return nextTrips[0]._id;
          if (!nextTrips.some((trip) => trip._id === current) && nextTrips[0]) {
            return nextTrips[0]._id;
          }
          return current;
        });
      } catch (err) {
        if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        setError('Could not load trips. Retry');
        notify('error', 'Could not load trips. Retry');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, handleLogout, notify, page]
  );

  useEffect(() => {
    if (!user) return undefined;

    const timer = setTimeout(() => {
      loadTrips({ reset: true });
    }, 250);

    return () => clearTimeout(timer);
  }, [user, filters.search, filters.status, filters.companion, filters.sort, loadTrips]);

  function replaceTrip(updated) {
    setTrips((prev) => prev.map((trip) => (trip._id === updated._id ? updated : trip)));
  }

  async function handleCreateTrip(form) {
    const trip = await api.createTrip(form);
    setShowCreateForm(false);
    setSelectedId(trip._id);
    await loadTrips({ reset: true });
    notify('success', 'Trip created');
  }

  async function handleUpdateTrip(id, form) {
    await api.updateTrip(id, form);
    setEditingTrip(null);
    await loadTrips({ reset: true });
    notify('success', 'Trip updated');
  }

  async function handleDeleteTrip(id) {
    setConfirmState({
      kind: 'trip',
      id,
      title: 'Delete this trip?',
      message: 'This will remove the trip and all of its places.'
    });
  }

  async function handleDeletePlace(placeId) {
    setConfirmState({
      kind: 'place',
      id: placeId,
      title: 'Delete this place?',
      message: 'This removes the place from the trip.'
    });
  }

  async function handleAddPlace(data) {
    const updatedTrip = await api.addPlace(selectedId, data);
    replaceTrip(updatedTrip);
    notify('success', 'Place added');
  }

  async function handleTogglePlace(placeId, done) {
    const updatedTrip = await api.updatePlace(selectedId, placeId, { done });
    replaceTrip(updatedTrip);
  }

  async function handleUpdatePlaceCost(placeId, cost) {
    const updatedTrip = await api.updatePlace(selectedId, placeId, { cost });
    replaceTrip(updatedTrip);
  }

  async function handleAddPacking(data) {
    const updatedTrip = await api.addPacking(selectedId, data);
    replaceTrip(updatedTrip);
    notify('success', 'Packing item added');
  }

  async function handleTogglePacking(itemId, packed) {
    const updatedTrip = await api.togglePacking(selectedId, itemId, packed);
    replaceTrip(updatedTrip);
  }

  async function handleDeletePacking(itemId) {
    const updatedTrip = await api.deletePacking(selectedId, itemId);
    replaceTrip(updatedTrip);
  }

  async function confirmAction() {
    if (!confirmState) return;

    try {
      if (confirmState.kind === 'trip') {
        await api.deleteTrip(confirmState.id);
        await loadTrips({ reset: true });
        notify('success', 'Trip deleted');
      }

      if (confirmState.kind === 'place') {
        const updatedTrip = await api.deletePlace(selectedId, confirmState.id);
        replaceTrip(updatedTrip);
        notify('success', 'Place deleted');
      }
    } finally {
      setConfirmState(null);
    }
  }

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  if (checkingSession) {
    return <div className="boot-screen">Loading…</div>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const selectedTrip = trips.find((trip) => trip._id === selectedId) || null;
  const filtersActive = filters.search || filters.status || filters.companion;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand-row">
          <div className="sidebar__brand">
            <span className="sidebar__brand-mark">✦</span>
            <div>
              <h1 className="sidebar__brand-title">Waypoint</h1>
              <p className="sidebar__brand-subtitle">{user.name}'s journal</p>
            </div>
          </div>
          <button className="theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <button className="btn btn--primary btn--full" onClick={() => setShowCreateForm(true)}>
          + Log a trip
        </button>

        <TripFilters filters={filters} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

        {loading && trips.length === 0 && (
          <div className="trip-list trip-list--skeleton" aria-label="Loading trips">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="trip-card trip-card--skeleton">
                <div className="trip-card__skeleton-line trip-card__skeleton-line--title" />
                <div className="trip-card__skeleton-line trip-card__skeleton-line--sub" />
                <div className="trip-card__skeleton-line trip-card__skeleton-line--meta" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="sidebar__status sidebar__status--error">
            <span>{error}</span>
            <button className="btn btn--small btn--ghost" onClick={() => loadTrips({ reset: true })}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
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
          </ul>
        )}

        {!loading && trips.length === 0 && !error && (
          <p className="sidebar__status">
            {filtersActive ? 'No trips match those filters.' : 'No trips yet. Log your first one above.'}
          </p>
        )}

        {hasMore && (
          <button className="btn btn--ghost btn--full" onClick={() => loadTrips({ append: true })} disabled={loadingMore}>
            {loadingMore ? 'Please wait…' : 'Load more'}
          </button>
        )}

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
            onAddPacking={handleAddPacking}
            onTogglePacking={handleTogglePacking}
            onDeletePacking={handleDeletePacking}
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

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || 'Confirm'}
        message={confirmState?.message || ''}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmAction}
      />

      <Toast toasts={toasts} />
    </div>
  );
}
