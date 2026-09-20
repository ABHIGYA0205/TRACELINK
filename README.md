# TraceLink

Trackable links with a Next.js interface and an Express/MongoDB analytics API.

## Local development

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.
2. Start the app with `npm run dev`. This starts both the Next.js app and the API used by signup.

To run them separately, use `npm run server` for the API and `next dev` for the frontend.

The frontend defaults to `http://localhost:5001` when `BACKEND_URL` is not set. The API defaults to allowing `http://localhost:3000` when `FRONTEND_URL` is not set.

## Deployment

Deploy the Next.js app to Vercel and the Express API to Render.

### Vercel environment variables

- `BACKEND_URL`: public HTTPS URL for the Render API, for example `https://tracelink-api.onrender.com` (no trailing slash).

### Render environment variables

- `MONGODB_URI`: MongoDB connection string.
- `FRONTEND_URL`: public Vercel URL. Multiple allowed origins can be comma-separated.
- `ENABLE_SEED_DATA`: set to `false` (or omit) in production; the development seed endpoint only runs when this is exactly `true`.
- `PORT`: provided automatically by Render.

Use `npm run server` as the Render start command. The API binds to `0.0.0.0` and uses Render's `PORT`.
