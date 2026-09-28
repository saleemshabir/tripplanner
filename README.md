# Waypoint — Travel Trip Planner (MERN)

A full-stack trip planner with user accounts: create trips with destinations,
dates, an estimated budget and travel companions; add places to visit, record
what you spent at each one, and mark them as visited. Search and filter your
trips. Built with MongoDB, Express, React (Vite) and Node.js.

**Features**
- Login / signup with hashed passwords and JWT sessions — each user sees only their own trips
- Trips with destination, dates, estimated budget + currency, companions and notes
- Places per trip with a cost field, so spend is tracked against the budget
- Budget summary showing estimated / spent / remaining, with an over-budget warning
- Search trips by title, destination, notes or companion; filter by upcoming / ongoing / past; sort by date, budget or title

```
travel-trip-planner/
├── backend/     Express API + Mongoose models
└── frontend/    React (Vite) single-page app
```

## 1. Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either:
  - MongoDB running locally (`mongod`), or
  - A free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `MONGO_URI` to your database connection string, e.g.:

```
MONGO_URI=mongodb://127.0.0.1:27017/travel-trip-planner
PORT=5000
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` signs your login tokens — set it to any long random string.

Start the API:

```bash
npm run dev     # with nodemon, auto-restarts on changes
# or
npm start
```

You should see `Server running on http://localhost:5000`.

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server
proxies any request to `/api/*` through to the backend on port 5000
(configured in `vite.config.js`), so no extra setup is needed.

## 4. Using the app

- On first run, click **Sign up** to create an account, then log in.
- Click **"+ Log a trip"** to create a trip (title, destination, dates, budget, currency, companions, notes).
- Select a trip in the left journal list to open its page.
- Use the **"Add a place to visit…"** field to add stops for that trip.
- Tap the circle next to a place to mark it visited / not visited.
- Click a place's cost chip to record what you spent there — the budget summary updates live.
- Use the search box and the status / sort / companion filters in the sidebar to find trips.
- Use **"Edit trip"** on the passport page to change dates, budget or companions.
- Delete individual places or whole trips with the ✕ / "Delete this trip" controls.

## 5. API reference

### Auth — base URL `/api/auth`

| Method | Route        | Description                       |
|--------|--------------|-----------------------------------|
| POST   | `/register`  | Create an account, returns a token |
| POST   | `/login`     | Log in, returns a token            |
| GET    | `/me`        | Current user (requires token)      |

### Trips — base URL `/api/trips`

All trip routes require an `Authorization: Bearer <token>` header.

| Method | Route                          | Description                    |
|--------|---------------------------------|---------------------------------|
| GET    | `/`                             | List your trips (see filters)  |
| POST   | `/`                             | Create a trip                  |
| GET    | `/:id`                          | Get one trip                   |
| PUT    | `/:id`                          | Update a trip                  |
| DELETE | `/:id`                          | Delete a trip                  |
| POST   | `/:id/places`                   | Add a place to a trip          |
| PUT    | `/:id/places/:placeId`          | Update / toggle a place        |
| DELETE | `/:id/places/:placeId`          | Remove a place                 |

Trip body: `{ title, destination, startDate, endDate, budget, currency, companions, notes }`
Place body: `{ name, notes, cost, done }`

`companions` accepts either an array of names or a comma-separated string.

**Query parameters on `GET /api/trips`:**

| Param       | Values                          | Description                                |
|-------------|----------------------------------|--------------------------------------------|
| `search`    | any text                        | Matches title, destination, notes, companions |
| `status`    | `upcoming` / `ongoing` / `past`  | Filter by trip dates vs today              |
| `companion` | any text                        | Trips including that companion             |
| `sort`      | `date` / `budget` / `title`      | Sort order (default `date`)                |

Each trip also returns computed `spent` and `remaining` values.

## 6. Deploying

- **Backend**: any Node host (Render, Railway, Fly.io, EC2...). Set `MONGO_URI`
  and `PORT` as environment variables. Point `frontend`'s API base URL at the
  deployed backend URL instead of the local Vite proxy for production builds.
- **Frontend**: `npm run build` in `frontend/` produces static files in
  `frontend/dist/` that can be served from any static host (Netlify, Vercel,
  S3, etc).

## Notes

- Places live as an embedded array on each Trip document — no separate
  collection is needed for this feature set, which keeps queries simple.
- Passwords are hashed with bcrypt before saving and never returned by the API.
  The login token is kept in the browser's localStorage, which is fine for a
  local/college project; a production app would normally use an httpOnly cookie.
- Search and filtering happen server-side in MongoDB, so they still work
  correctly once you have more trips than fit on one screen.
- CORS is enabled on the API so the frontend can be hosted separately from
  the backend in production if you choose to.
