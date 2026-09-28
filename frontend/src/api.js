import axios from 'axios';

const TOKEN_KEY = 'waypoint_token';

const api = axios.create({ baseURL: '/api' });

// Attach the saved login token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/* ---------------- Auth ---------------- */

export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const login = (data) => api.post('/auth/login', data).then((r) => r.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data);

/* ---------------- Trips ---------------- */

// filters: { search, status, companion, sort }
export const fetchTrips = (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return api.get('/trips', { params }).then((r) => r.data);
};

export const fetchTrip = (id) => api.get(`/trips/${id}`).then((r) => r.data);
export const createTrip = (data) => api.post('/trips', data).then((r) => r.data);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data).then((r) => r.data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`).then((r) => r.data);

/* ---------------- Places ---------------- */

export const addPlace = (tripId, data) => api.post(`/trips/${tripId}/places`, data).then((r) => r.data);
export const updatePlace = (tripId, placeId, data) =>
  api.put(`/trips/${tripId}/places/${placeId}`, data).then((r) => r.data);
export const deletePlace = (tripId, placeId) =>
  api.delete(`/trips/${tripId}/places/${placeId}`).then((r) => r.data);

export default api;
