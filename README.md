# Waypoint — Travel Trip Planner (MERN)

Waypoint is a full-stack trip planner that lets users log trips, keep track of costs, manage packing lists, and review their plan in one place. The project uses Node.js, Express, MongoDB and React with Vite.

## Features

- Login and signup with secure password validation and JWT sessions
- Trip list with search, status filtering, companion filtering and sorting
- Budget tracking with estimated spend, remaining balance and over-budget warnings
- Places with category labels, cost tracking and visited states
- Packing checklist with per-item done tracking
- Pagination for large trip lists
- Dark mode for both app and forms
- Export to PDF for a trip summary and place table
- Toast notifications and confirmation dialog UX improvements
- Server-side security hardening with CORS, helmet, sanitization and rate limiting

## Project structure

```text
travel-trip-planner/
├── backend/     Express API + Mongoose models
├── frontend/    React + Vite app
├── .gitignore
├── README.md
└── package-lock.json
```

## 1. Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas cluster or a local MongoDB instance

## 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

On macOS or Linux use `cp .env.example .env` instead. Then set the values in `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/travel-trip-planner
PORT=5000
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`MONGO_URI` and `JWT_SECRET` are required. `CLIENT_URL` can contain multiple origins separated by commas.

Start the API:

```bash
npm run dev
# or
npm start
```

You should see a message similar to:

```text
Server running on http://localhost:5000
```

## 3. Frontend setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` in the frontend `.env` file if you are not using the default local proxy:

```env
VITE_API_URL=http://localhost:5000/api
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## 4. Using the app

- Sign up with a valid email and a password of at least 8 characters containing a letter and a number.
- Log a trip with title, destination, dates, budget and companions.
- Add places with cost and category, then mark them visited.
- Use the sidebar filters to search, sort and paginate trips.
- Use the trip detail page to review spending by category and manage the packing list.
- Export a trip summary as a PDF from the detail view.
- Switch between light and dark mode from the sidebar.

## 5. API reference

All protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Get the current logged-in user |

### Trips

| Method | Route | Description |
|---|---|---|
| GET | `/api/trips` | List trips for the logged-in user with filters and pagination |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/:id` | Fetch one trip |
| PUT | `/api/trips/:id` | Update a trip |
| DELETE | `/api/trips/:id` | Delete a trip |
| POST | `/api/trips/:id/places` | Add a place |
| PUT | `/api/trips/:id/places/:placeId` | Update a place |
| DELETE | `/api/trips/:id/places/:placeId` | Remove a place |
| POST | `/api/trips/:id/packing` | Add a packing item |
| PUT | `/api/trips/:id/packing/:itemId` | Toggle a packing item |
| DELETE | `/api/trips/:id/packing/:itemId` | Remove a packing item |

### Trip query params

The main trip list supports the following query params:

- `search` — text match against trip title, destination, notes and companions
- `status` — `upcoming`, `ongoing`, `past`
- `companion` — filter by companion name
- `sort` — `date`, `budget`, `title`
- `page` — page number, default 1
- `limit` — page size, default 10

Response format for `GET /api/trips`:

```json
{
  "trips": [],
  "page": 1,
  "totalPages": 1,
  "total": 0
}
```

Trip and place validation rules:

- Title and destination are required
- Start and end dates are required and must be valid
- End date cannot be earlier than the start date
- Budget must be a non-negative number
- Passwords must be at least 8 characters and contain a letter and a number

## 6. Deployment

- Backend can be hosted on Render, Railway, Fly.io, Docker, EC2 or any Node-compatible host.
- Set `MONGO_URI`, `JWT_SECRET`, `PORT`, `JWT_EXPIRES_IN` and `CLIENT_URL` as environment variables.
- Frontend should use `VITE_API_URL` in production to point to the deployed backend URL.
- Run `npm run build` in `frontend/` to generate the production bundle in `frontend/dist/`.

## Notes

- Places are stored as an embedded sub-document on each trip.
- Passwords are hashed before saving and never returned in API responses.
- The API uses CORS restrictions from `CLIENT_URL` and blocks missing required environment variables at startup.
- The global error handler returns 400 for validation and cast errors, 409 for duplicate keys, and 500 for unhandled issues.
