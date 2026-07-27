# Smart Restaurant Ecosystem — Full Build Plan (Phases 0–15)

## Overview

Build the complete Smart Restaurant Ecosystem (SRE) end-to-end: a MERN-stack application with real-time kitchen scheduling, live Estimated Time of Arrival (ETA) tracking, weather-aware menu recommendations, and Razorpay payment integration. All 16 phases will be built in order per the build manual.

> [!IMPORTANT]
> **Key constraints from the manual:**
> - **Database:** MongoDB only — no PostgreSQL or second database
> - **Mapping:** Leaflet.js + OpenStreetMap + OSRM only — no Google Maps
> - **Design:** Exactly 6 color tokens, 3 typefaces, specified spacing scale — no ad-hoc additions
> - **Payments:** Razorpay with both client verify AND webhook confirmation
> - **State updates:** Atomic conditional `findOneAndUpdate`, never read-then-write

---

## Proposed Changes

### Phase 0 — Setup (Scaffold)
- Initialize `client/` with Vite + React + Tailwind CSS
- Initialize `server/` with Express + Mongoose
- Baseline middleware: helmet, cors (locked to CLIENT_URL), express-mongo-sanitize, morgan
- `GET /api/health` route with MongoDB ping
- `.env.example` with all env vars from Section 3
- `docs/decisions.md` started

### Phase 1 — Design Foundations & Shared Components
- `tailwind.config.js` with exact design tokens (ink, steel, surface, ember, herb, rail)
- Google Fonts: Archivo Narrow, Public Sans, IBM Plex Mono
- Shared components: Button, Input, Card, Badge/StatusChip, Toast, Skeleton, EmptyState, CountdownChip
- Internal `/dev/styleguide` page rendering all components and states

### Phase 2 — Auth & Core Data
- User model with bcrypt hashing
- JWT access + refresh token pair
- `/api/auth/register`, `/login`, `/refresh` routes
- `authMiddleware` + `requireRole()` middleware
- `seed.js` with owner, restaurant, and menu items

### Phase 3 — Restaurant & Menu Management
- MenuItem CRUD scoped to ownerId
- Cloudinary image upload (multer + Cloudinary SDK)
- weatherTags on menu items
- Owner dashboard UI using Phase 1 components

### Phase 4 — Customer Ordering
- Public menu view by restaurant
- Cart via React Context
- `POST /api/orders` with server-side price recomputation
- QR code scanning flow

### Phase 5 — Real Payments
- Razorpay create-order endpoint
- Client-side Razorpay checkout integration
- Server-side HMAC signature verification
- Independent webhook endpoint with `RAZORPAY_WEBHOOK_SECRET`
- Idempotent status transitions

### Phase 6 — Live Location + Decision Engine v1
- Browser Geolocation API integration
- OSRM routing service wrapper with graceful degradation
- Decision Engine: ETA + prepTime → cookStartDelay → cookingWindow
- Manual address fallback via Nominatim

### Phase 7 — Kitchen Display (KDS) + Realtime
- Socket.io server with rooms per restaurant and per order
- Dark KDS UI (ink background) with ticket-rail cards
- Customer tracking screen with CountdownChip + Leaflet map
- Real-time order status updates

### Phase 8 — Weather + Recommendations
- OpenWeather API integration with WeatherCache (15-min TTL)
- Menu re-ranking score: weatherMatch + popularityScore + availability
- "Good pick today" tags on menu cards

### Phase 9 — Continuous ETA
- `node-cron` safety-net sweep for active orders
- Client-pushed location updates via Socket.io
- Drift threshold detection → priority recomputation
- Chef manual override (`chefLocked: true`)
- Atomic conditional `findOneAndUpdate`

### Phase 10 — Notifications
- Notification model with per-user documents
- Created on order status changes
- Read/unread state with mark-read endpoint
- Works for offline clients

### Phase 11 — Analytics (Mongo Rollups)
- Aggregation pipelines: revenue by day/category, top items, peak hours
- Nightly `node-cron` job → AnalyticsRollup collection
- Dashboard reads rollups for historical, live pipeline for "today"

### Phase 12 — Admin Panel
- Admin role with restaurant-approval workflow
- User list/suspend actions
- Deliberately plain UI per Section 7

### Phase 13 — Security Hardening
- Rate-limit `/auth/*` with express-rate-limit
- Validator audit on all mutating routes
- Hardcoded secrets grep
- HTTPS verification

### Phase 14 — Testing
- Priority: payment failure/duplicate → expired tokens → API outage fallback → GPS denied → chef offline
- Integration tests with Jest/Supertest

### Phase 15 — Deployment Config
- Vercel config for client
- Render/Railway config for server
- MongoDB Atlas backup notes
- Smoke-test checklist

---

## Verification Plan

### Per-Phase Verification
- Phase 0: `npm run dev` boots both sides; health check returns `dbConnected: true`
- Phase 1: Styleguide page renders all components with correct tokens
- Phase 2: Full auth flow including token refresh and role blocking
- Phase 3: Owner CRUD with image upload; cross-owner rejection
- Phase 4: Order creation with tampered price recomputation
- Phase 5: Test-mode payment with signature verification
- Phase 6: ETA calculation from real coordinates
- Phase 7: Real-time status push between KDS and customer
- Phase 8: Menu order changes with different weather conditions
- Phase 9: Location drift triggers priority push
- Phase 10: Notifications persist for offline clients
- Phase 11: Dashboard shows real aggregated data
- Phase 12: Restaurant approval workflow
- Phase 13: Rate limiting blocks brute force
- Phase 14: Tests pass for critical failure paths
- Phase 15: Deployment configs ready

> [!NOTE]
> This is a large build. I will proceed through all phases sequentially, logging decisions in `docs/decisions.md` as I go. Any deviations from the manual will be flagged explicitly.
