# TraceLink

TraceLink is a private, account-based link analytics app. Create a short tracking link, share it anywhere, and see how people engage with it—without exposing one user’s links or analytics to another.

The product includes a polished dark interface, a responsive analytics dashboard, and lightweight visit tracking for browser, operating system, device type, referrer, and timestamp.

## Features

- Secure signup, login, logout, and server-backed sessions
- Private workspaces: users can only view and manage their own links
- Create named, shareable tracking links
- Public redirect route that records a visit before sending visitors to the destination
- Link analytics for visits, unique visitors, devices, browsers, operating systems, and referrers
- Time-range filtering for the last 7 or 30 days
- Delete links that are no longer needed
- Responsive dark UI with motion-based dashboard interactions

## Tech stack

- [Next.js](https://nextjs.org/) and React for the web application
- Express for the analytics and authentication API
- MongoDB and Mongoose for persistence
- Framer Motion for UI animation
- Lucide for icons

## Run locally

### Prerequisites

- Node.js 22 or newer
- A MongoDB database (Atlas or local MongoDB)

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tracelink
PORT=5001
SESSION_SECRET=replace-with-a-long-random-secret
```

`SESSION_SECRET` is required in production. Use a long, unique random value—never commit it to source control.

### 3. Start the app

```bash
npm run dev
```

This starts both services together:

- Next.js web app: `http://localhost:3000`
- Express API: `http://localhost:5001`

Open `http://localhost:3000`, create an account, and make your first tracking link.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the API and Next.js development server together |
| `npm run server` | Starts only the Express API on `PORT` (default `5001`) |
| `npm run build` | Creates an optimized Next.js production build |
| `npm run start` | Serves the built Next.js application |
| `npm run lint` | Runs ESLint |

## Project structure

```text
app/
  api/                 Next.js API proxies to the Express backend
  create/              Auth-protected link creation page
  dashboard/           Auth-protected analytics dashboard
  links/               Auth-protected link management page
  login/ + signup/     Account access screens
  t/[slug]/            Public tracked redirect route
components/            Shared interface components and auth guard
lib/                   Backend URL helper
server/server.js       Express API, database models, auth, and tracking
```

## Environment variables

### Local development

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `PORT` | No | Express API port; defaults to `5001` |
| `SESSION_SECRET` | Recommended | Secret used to sign user sessions |
| `FRONTEND_URL` | No | Allowed frontend origin; defaults to `http://localhost:3000` |
| `ENABLE_SEED_DATA` | No | Set to `true` only when using the development seed endpoint |

### Deployment

Deploy the Next.js application and Express API separately.

For the Next.js deployment, set:

```env
BACKEND_URL=https://your-api.example.com
```

For the Express API deployment, set:

```env
MONGODB_URI=...
SESSION_SECRET=...
FRONTEND_URL=https://your-app.example.com
NODE_ENV=production
```

Use `npm run server` as the API service start command. The server binds to `0.0.0.0` and respects the platform-provided `PORT`.

## Privacy and data handling

Each link belongs to the account that created it. Link listing, analytics, and deletion endpoints require a valid signed-in session and scope database queries to that owner. The public `/t/:slug` route is intentionally accessible so shared links can redirect and record visits.

For a production deployment, review your privacy policy, retention rules, and local regulations before collecting visitor IP addresses or analytics data.

## Quality checks

Before shipping changes, run:

```bash
npm run lint
npm run build
```

## License

This project is private and has no license specified.
