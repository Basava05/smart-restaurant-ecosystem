# Smart Restaurant Ecosystem (SRE)
## Build Manual — Agentic Build Edition

> Restructured so you can hand phases to an agentic coding AI (Claude Code, Cursor, etc.) one at a time, using a fully free tech stack throughout, with an actual design system so pages don't end up looking inconsistent or ad hoc.

---

## 0. How To Actually Use This Document

**The trap to avoid:** pasting this whole file into an agent and saying "build all of it." You'll get a working app you don't understand and can't maintain — and, just as bad, a UI where every page was styled by a slightly different set of decisions. A smaller project you deeply understand, built on one consistent design system, beats a bigger inconsistent one every time.

**The workflow that actually works:**

1. Give the agent the shared context **once** — Sections 3–7 (stack, architecture, schemas, Decision Engine, design system) — so it doesn't reinvent them differently in every phase.
2. Hand it **one phase** from Section 8 at a time, using that phase's prompt template.
3. Read the diff before accepting it. Anything unfamiliar → ask the agent directly: *"Explain this to me in plain language until it actually makes sense."*
4. Run it. Check it against that phase's acceptance criteria before moving on.
5. Say back to yourself (or jot in `docs/decisions.md`) *why* it works the way it does, not just that it runs. If you can't, you're not done with the phase yet.
6. Commit with a message describing what and why — not "phase 3 done."
7. Only then start the next phase.

Treat the agent as a fast pair-programmer with no memory of yesterday's decisions. It can write the code, but it won't remember why it chose something last week unless you write it down in `docs/decisions.md` — so don't let that be the only place the reasoning lives.

**Kickoff prompt — paste this to your agentic AI first, with this file attached/in the repo:**

> Read the entire attached SRE-Build-Manual.md before writing any code — all sections, including the tech stack, architecture, schemas, the Decision Engine algorithm, the design system, and the non-negotiable rules in Section 10. Then follow the phased build plan in Section 8, starting at Phase 0, under these rules:
>
> 1. Build exactly **one phase at a time**, in order. Don't start the next phase until I explicitly tell you to.
> 2. After finishing a phase, stop and give me: what you built and why, any place you deviated from the manual and your reasoning, and that phase's "Done when" criteria so I can verify it myself.
> 3. Never violate the non-negotiable rules in Section 10 — if a later request from me seems to conflict with one, flag it instead of silently complying.
> 4. Stick to the schemas, folder structure, and architecture in Sections 3–6 exactly. If my request conflicts with them, tell me before changing anything.
> 5. Write clean, commented code, and follow the Section 7 design tokens exactly — don't introduce new colors, fonts, or spacing values on your own. I'm learning this stack as we go and need to be able to explain every part of it myself, not just have it work.
> 6. After each phase, add a short entry to `docs/decisions.md` explaining what we built and why, in plain language I could repeat out loud.
> 7. If anything in the manual is ambiguous, ask me rather than guessing silently.
>
> Confirm you've read the manual, then tell me you're ready for Phase 0.

**A few things that make this actually work, not just look good on paper:**
- Read what it writes before saying "continue" — approving without reading defeats the entire point of building this yourself.
- Keep the manual in the repo root; rename it `README.md` (or keep both) once you deploy.
- Write your own line in `docs/decisions.md` after the agent's explanation, in your own words — that's what actually builds understanding, not copying its explanation verbatim.
- Don't move to the next phase until you can recite that phase's "Explain before moving on" bullets without looking at the file.

---

## 1. Problem Statement

**Customer side:** long waits before ordering, no pre-order option, no idea how long food will take, no personalization, queueing again just to pay.

**Restaurant side:** manual menu/billing, kitchens get slammed in bursts because orders arrive with no relation to when the customer will actually be there, no real insight into what's selling.

**Kitchen side:** no arrival prediction, no cooking priority, food goes cold from starting too early or customers wait from starting too late.

**Why existing QR-menu apps don't solve this:** they digitize the menu and the payment, but still treat "order placed" and "food ready" as unrelated events. None of them ask *when* the customer will actually be standing at the table.

---

## 2. The Solution

QR scan → weather-aware digital menu → order + payment → live ETA from the customer's device to the restaurant → a Decision Engine that tells the kitchen exactly when to start cooking → real-time updates the whole way → food ready close to arrival, not early and not late.

**The core idea, in one line:** the differentiator isn't any single feature — it's that ETA, weather, and kitchen load all feed into **one decision**, not three separate ones.

---

## 3. Tech Stack — 100% Free Tier

### Frontend
| Piece | Choice | Why |
|---|---|---|
| Framework | React + Vite | Faster dev server than CRA |
| Styling | Tailwind CSS | Fast iteration; theme tokens defined once (Section 7) and reused everywhere — this is what actually keeps every page looking consistent |
| Animation | Framer Motion, used sparingly (status transitions, the countdown chip) | Motion should mark a real state change, not decorate |
| State | React Context (auth/session) + TanStack Query (server state/caching) | Avoids Redux boilerplate; React Query gives free caching + refetch as a Socket.io fallback |
| Realtime client | `socket.io-client` | |
| Maps | `react-leaflet` + `leaflet`, tiles from OpenStreetMap | Free, no API key required — requires a visible "© OpenStreetMap contributors" attribution on the map (a license requirement, not optional) |
| Location | Browser Geolocation API (native — no package) | Free, built into every modern browser; requires HTTPS in production (blocked over plain HTTP except on `localhost`) |
| Forms | React Hook Form + Zod | Mirrors backend validators |

### Backend
| Piece | Choice | Why |
|---|---|---|
| Runtime | Node.js + Express | One language end to end |
| ODM | Mongoose | Schema validation on top of MongoDB's flexibility |
| Auth | JWT (access + refresh pair) + bcrypt | Standard |
| Realtime | Socket.io (server) | Rooms per restaurant + per order |
| Validation | Zod or Joi in a `validators/` layer | Never trust client input, especially price/quantity |
| Scheduling | `node-cron` | Recheck-ETA loop + nightly analytics rollup |
| Routing/ETA | OSRM (Open Source Routing Machine) — public demo server, or self-hosted via Docker | Free, open-source; no API key, no per-request billing |
| File storage | Cloudinary (free tier) | Never store images in MongoDB |
| Payments | Razorpay Node SDK (test/sandbox mode — free for development) | Signature verification server-side, no exceptions |

### Databases

**MongoDB (Atlas, free M0 tier) — the only database.** Stores `Users`, `Restaurants`, `MenuItems`, `Orders`, `Payments`, `Bookings`, `Notifications`, `Inventory`, `WeatherCache`, and `AnalyticsRollup` (Section 5). Restaurant menus and order shapes genuinely don't share a fixed structure across restaurants, which is why document storage fits — and at this project's real scale (one to a handful of restaurants), Mongo's own aggregation framework (`$group`, `$facet`, `$lookup`, `$bucket`) comfortably covers every reporting need on its own. A precomputed `AnalyticsRollup` collection (populated nightly, Section 5) keeps the owner dashboard fast without re-running heavy pipelines on every page load. No second database needed.

### External Services (all free tier / free to use)
- **OSRM** — routing/ETA. Public demo server (`router.project-osrm.org`) for development; self-hostable via Docker later if you want more control over uptime.
- **OpenStreetMap** — map tiles. Free; requires attribution.
- **Nominatim** (optional) — address-to-coordinates geocoding, only if you add manual address entry as a fallback. Free, but strict: max 1 request/second, and a descriptive `User-Agent` header is required by its usage policy.
- **OpenWeather** — weather data, free tier.
- **Razorpay** — payments, test/sandbox mode is free for development (production takes a standard small transaction fee, same as any payment gateway).
- **Cloudinary** — image hosting, free tier.

### Environment Variables (set up in Phase 0, fill in as each phase needs them)
```
PORT
CLIENT_URL                    # for CORS, restrict to this origin only
MONGO_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET       # separate from the key secret — see Phase 5
OSRM_BASE_URL                 # e.g. https://router.project-osrm.org, or your self-hosted instance
NOMINATIM_BASE_URL            # optional — only if you add address search/geocoding
WEATHER_API_KEY
```

---

## 4. System Architecture

```
Customer App (React) ──┐
Restaurant Dashboard ──┤
Kitchen Display (KDS) ─┼──► Express API ──► MongoDB (only database)
Admin Panel ────────────┘        │
                                  ├──► Decision Engine (service, not a separate server)
                                  │        ├─ ETA sub-logic (OSRM, fed by Browser Geolocation)
                                  │        ├─ Weather sub-logic (Weather API + cache)
                                  │        └─ Kitchen scheduling sub-logic
                                  ├──► Socket.io (realtime push to all four clients)
                                  ├──► Razorpay (payment verification)
                                  └──► [Phase 11] nightly rollup job → AnalyticsRollup collection (same Mongo DB)
```

### Folder Structure
```
smart-restaurant-ecosystem/
├── client/
│   ├── src/
│   │   ├── components/ui/    # Button, Input, Card, Badge/StatusChip, Toast, Skeleton, CountdownChip
│   │   │                     # — built once in Phase 1, reused by every phase after
│   │   └── ...
│   └── tailwind.config.js     # design tokens from Section 7 live here, not scattered per-component
├── server/
│   ├── config/                # db, cloudinary, jwt, api keys
│   ├── controllers/           # auth, restaurant, menu, order, payment, booking, kitchen, admin
│   ├── models/                 # Mongoose schemas
│   ├── routes/
│   ├── middleware/             # auth, role-check, rate-limit, error handler
│   ├── services/
│   │   ├── decisionEngine/     # eta.js (OSRM), weather.js, kitchenScheduler.js, index.js
│   │   ├── paymentService.js
│   │   └── analyticsRollup.js  # Phase 11: nightly Mongo-only rollup job
│   ├── validators/
│   ├── socket/
│   └── server.js
└── docs/
    └── decisions.md            # your running "why I built it this way" log — keep this updated
```

---

## 5. Database Design — MongoDB Schemas (the only database)

```js
// User
{ name, email, passwordHash, phone, role: ['customer','owner','chef','admin'],
  profileImage, status, createdAt, lastLogin }

// Restaurant
{ name, ownerId, address, location: { lat, lng }, openingTime, closingTime,
  cuisine, avgPrepTime, rating, logo, qrCode, status }

// MenuItem
{ restaurantId, name, description, category, price, prepTime, image,
  available, weatherTags: [String], popularityScore }

// Order
{ customerId, restaurantId, items: [{ menuItemId, qty, price }], totalPrice,
  paymentStatus, orderStatus, cookingStatus, chefLocked,
  table: { number, time } | null,
  eta: { initial, current, lastUpdated },
  cookingWindow: { estimatedStart, estimatedFinish },
  actualArrival, actualDelivery, createdAt }

// Payment
{ orderId, customerId, amount, method, razorpayOrderId, razorpayPaymentId,
  signatureVerified, status, createdAt }

// Notification
{ type, receiverId, title, message, read, createdAt }

// Inventory
{ restaurantId, item, quantity, unit, lowStockThreshold }

// WeatherCache
{ locationKey, temperature, condition, humidity, rain, fetchedAt } // TTL index ~15 min

// AnalyticsRollup — Phase 11, populated by a nightly job, never queried live per request
{ restaurantId, date, revenue, orderCount, topItems: [{ itemId, name, qty }],
  avgEtaAccuracyMinutes, weatherBreakdown: [{ condition, orderCount }] }
```

**Indexes to add early:** `Restaurant.location` (2dsphere, proximity), `Order.restaurantId + orderStatus` (kitchen queue queries), `MenuItem.restaurantId + weatherTags`, `WeatherCache` TTL index on `fetchedAt`, `AnalyticsRollup.restaurantId + date` (unique compound — one document per restaurant per day).

**Why Mongo alone is enough here:** a second database earns its operational cost when you're genuinely joining across a scale one server can't aggregate quickly. At this project's real scale — one to a handful of restaurants — `$facet` and `$lookup` inside a single aggregation pipeline answer "revenue by day, by category, cross-tabbed with weather" perfectly well, and the nightly rollup keeps even that pipeline off the hot path. A second database here would be complexity without a matching problem.

---

## 6. The Decision Engine — How It Actually Works

One service, three inputs, not three services:

```
Input:  customerLocation (from Browser Geolocation, pushed by the client), orderItems, restaurantLoad, currentWeather
Step 1: ETA = RoutingService.getETA(customerLocation, restaurantLocation)   // OSRM route duration
Step 2: prepTime = sum(item.prepTime for item in orderItems) adjusted by kitchen queue length
Step 3: cookStartDelay = ETA - prepTime   // if positive, wait this long before starting
Step 4: schedule cooking at (now + cookStartDelay), or immediately if delay <= 0
Step 5: recheck triggers on either:
           (a) the client pushes an updated location via socket whenever it moves past a distance
               threshold (`watchPosition`), or
           (b) a node-cron safety-net sweep every N minutes, for clients whose location stops
               updating (permission revoked, tab backgrounded)
        On any recheck: recompute ETA →
           if drifted beyond threshold (e.g. ±5 min): recompute cookStartDelay via one atomic
           conditional update → push priority change to kitchen via Socket.io
Step 6 (runs separately, at menu-load time only, not per-order):
           score = weatherMatch(item.weatherTags, currentWeather)
                 + popularityScore * weight
                 + availability
           sort menu by score, don't hide anything, just re-rank
```

Non-negotiable behaviors: cooking never starts before payment confirmation (unless Cash on Arrival is enabled); the chef can always manually override the schedule; recommendations only ever re-rank, never restrict, and are never framed as medical/health advice — just "commonly enjoyed in this weather."

---

## 7. Design System — UI/UX Direction

**Why this section exists:** "make it look nice" isn't a specification an agentic AI (or anyone) can build consistently from — that's exactly how you end up with clashing colors on one page and default browser buttons on the next. This section is the specification. Give it to the agent in Phase 1, before any real feature gets built, and treat every token below as a rule, not a suggestion.

### The subject, stated plainly
This isn't a generic "food app." It's a live kitchen-timing operations tool with an ordering layer on top — the difference between a restaurant's dining room and its kitchen pass. Four genuinely different people use it: a customer on their phone deciding what to eat; a chef glancing at a wall-mounted screen mid-cook; an owner checking numbers at a desk; an admin doing occasional housekeeping. Four different jobs — they should not share one templated look.

### Design tokens
Put these directly into `tailwind.config.js`. Don't let colors get chosen ad hoc per component.

| Token | Hex | Used for |
|---|---|---|
| `ink` | `#1E2320` | Primary text; the Kitchen Display's background |
| `steel` | `#EDEFEC` | Page background — customer app, owner dashboard, admin panel |
| `surface` | `#FFFFFF` | Cards and panels sitting on top of `steel` |
| `ember` | `#E2571D` | Primary action color; "cooking now" / urgent countdown state |
| `herb` | `#3F6A52` | Success, "ready," confirmed states |
| `rail` | `#45566B` | Secondary chrome — borders, secondary buttons, dividers |

Six named colors, not more. Charts, badges, and every "just this once" component pull from this list — none introduce a seventh.

**Typography** — three roles, not one face doing everything:
- **Display/headers:** Archivo Narrow — condensed, has the character of a printed kitchen ticket. Page titles and section headers only, set with real weight, not thin.
- **Body:** Public Sans — clean, highly legible, used for everything else: menu descriptions, form labels, dashboard text.
- **Data/numerals:** IBM Plex Mono — order numbers, timestamps, and, critically, the countdown chip below. Tabular figures should always line up.

Type scale: 12 / 14 / 16 / 20 / 24 / 32 / 48px, weights 400/500/600/700 only.

**Spacing & shape:** 4px base unit, scale of 4/8/12/16/24/32/48/64. Radius stays small and quiet everywhere — 4px on inputs/buttons, 8px on cards — sharp and ticket-like, not the generic bubbly rounded-2xl SaaS look. Spend the one deliberately bold, fully-rounded shape on a single element (below) instead of scattering it.

**Motion:** 150–200ms ease-out for hover/focus states; a real transition (fade + slight slide) when an order's status actually changes on the Kitchen Display; nothing decorative beyond that. Respect `prefers-reduced-motion`. If in doubt, cut the animation — over-animating is what makes an interface feel synthetic, not what makes it feel polished.

### The signature element: the countdown chip
One component appears everywhere — the customer's tracking screen, every order card on the Kitchen Display, the owner's live-orders view — and it's the one place the design gets bold: a pill-shaped, monospace countdown that ticks down to cook-start or ready-time, and changes color with real meaning, not decoration:
- `rail`-bordered, neutral — waiting, plenty of time
- `ember`, filled — cook-start is imminent or overdue
- `herb`, filled — ready / delivered

Everything else on the page stays quiet specifically so this one element reads as the thing the whole app orbits around — which, mechanically, it is.

### Per-interface direction

**Customer app (mobile-first, light — `steel`/`surface`):** appetite-forward menu grid; weather re-ranking surfaced as a small "good pick today" tag on a card, never a hard filter; sticky bottom cart bar; the tracking screen is dominated by the countdown chip plus a simple Leaflet route line from customer to restaurant. Minimal chrome — this screen's whole job is "what do I want, and when will it arrive."

**Kitchen Display (KDS) — dark, `ink` background:** the one deliberately dark screen, for a real reason, not a style preference — commercial kitchen displays run dark because they're read from a few feet away in a bright, hot, glare-prone room, often for hours at a stretch. Dense ticket-rail cards sorted by urgency, large mono countdown numerals, a colored left border per card (`rail` = queued, `ember` = cook now, `herb` = ready). No illustration, no decorative elements — a KDS is read at a glance, not admired.

**Owner dashboard (light, data-dense):** KPI cards across the top, charts below pulling only from the six tokens above (don't let a charting library's default palette sneak in a seventh color), order history as a plain table underneath.

**Admin panel (light, minimal):** the least designed of the four, deliberately — it's an internal tool used occasionally, and over-investing here is effort spent on the wrong screen.

### Components every phase needs, with real states
Button (primary/secondary; hover/focus/active/disabled/loading), text input (default/focus/error — the error message written inline beneath the field, not just a red border), status badge (queued/cooking/ready/delivered/cancelled, each mapped to a token color), toast/notification, skeleton loader (for the menu and dashboard while data loads — not a bare spinner on every page), empty state ("No orders yet today," with one clear next action, never a blank rectangle). Build these once in Phase 1; every later phase reuses them instead of inventing new ones — this single habit is what actually prevents pages from looking inconsistent with each other.

### Writing on the interface
Plain, active voice: a button says "Place order," not "Submit," and the confirmation that follows says "Order placed" — the same verb, not a different one. Name things by what the person controls ("your order," not "the session object"). An error states what happened and how to fix it, in the interface's own voice, never vague — "This restaurant isn't taking new orders right now — try again in a few minutes," not "Something went wrong." An empty state is an invitation to act, not a dead end.

### What to explicitly avoid
- The generic AI-app look: a warm cream background with a terracotta accent, or an all-black background with one neon accent, applied to every screen regardless of what it's for. Dark mode belongs to the Kitchen Display specifically, for the glare/distance reason above — not the whole app.
- Default, unstyled browser inputs or buttons sitting next to designed ones on the same page.
- A different spacing scale or color creeping in per page because a phase was built in isolation — Phase 1 exists specifically to prevent this.
- Numbered step markers (01/02/03) unless something is a genuine sequence — a menu grid or a KPI row isn't.
- Decoration for its own sake — every color, shadow, and animation on the page should be doing one of the jobs above, or it comes out.

---

## 8. Phased Build Plan — Agent-Ready

Feed one phase at a time. Each entry: goal → tasks → a prompt template for the agent → what you must be able to explain unassisted → how you know it's done.

### Phase 0 — Setup
**Goal:** runnable skeleton, both servers boot, DB connects.
**Tasks:** repo with `client/` (Vite+React+Tailwind) and `server/` (Express); `.env` + `.env.example`; `config/db.js` Mongoose connection; baseline middleware — `helmet`, `cors` (locked to `CLIENT_URL`, not `*`), `express-mongo-sanitize` (blocks NoSQL-injection payloads like `{"$gt": ""}` in request bodies), `morgan` request logging; `GET /api/health` route; placeholder React route; git init + `.gitignore`.

**Prompt template:**
> "Scaffold a MERN project using this folder structure: [paste Section 4 structure]. Client: Vite + React + Tailwind. Server: Express + Mongoose. Add baseline middleware: helmet, cors restricted to CLIENT_URL, express-mongo-sanitize, and morgan logging. Add `GET /api/health` that also pings MongoDB and reports connection status. Include `.env.example` listing all variables from Section 3's Environment Variables list. Don't build anything beyond this skeleton."

**Explain before moving on:** what a connection pool is and why Mongoose keeps one open rather than reconnecting per request; what NoSQL injection actually looks like and why sanitizing request bodies stops it.
**Done when:** `npm run dev` works on both sides; health check returns 200 with `dbConnected: true`; a request with a `$`-operator payload in the body gets stripped, not executed.

### Phase 1 — Design Foundations & Shared Components
**Goal:** every later phase pulls from one visual source of truth instead of inventing its own.
**Tasks:** implement the tokens from Section 7 in `tailwind.config.js` (colors, font families, spacing scale, radius); build the shared component set — Button, Input, Card, Badge/StatusChip, Toast, Skeleton, EmptyState, and the CountdownChip — each with the states listed in Section 7; assemble a small internal style-guide page (e.g. `/dev/styleguide`, not shown to real users) rendering every component and state together for a quick visual check.
**Tell the agent:** implement exactly the tokens and components specified in Section 7 — don't introduce colors, fonts, or spacing values outside that list. Build the style-guide page so every component and state can be checked in one place before any real page uses them.
**Explain before moving on:** why a shared, built-once component layer is what actually prevents inconsistent-looking pages later, more than any individual phase's effort; why the Kitchen Display gets a dark background specifically while the rest of the app doesn't.
**Done when:** the style-guide page shows every component/state correctly; from this point forward, nothing gets styled outside these tokens.

### Phase 2 — Auth & Core Data
**Goal:** working login/register with roles, one seeded restaurant.
**Tasks:** `User` model; bcrypt hash on save; JWT access (short-lived) + refresh (long-lived) pair; `/api/auth/register`, `/login`, `/refresh`; auth middleware verifying access tokens; role-check middleware; `seed.js` inserting one owner + restaurant + a handful of menu items.
**Tell the agent:** implement password hashing, JWT access+refresh issuance, the three auth routes, `authMiddleware`, `requireRole(...)`, and `seed.js` per Section 5's schemas.
**Explain before moving on:** why two tokens instead of one; where you store the refresh token and why; why role checks must run server-side on every route, not just hide UI buttons client-side.
**Done when:** register → login → hit a protected route → token expires → refresh works → wrong role gets blocked.

### Phase 3 — Restaurant & Menu Management
**Goal:** owner can manage their own menu, using the Phase 1 components.
**Tasks:** menu CRUD scoped to `ownerId`; Cloudinary upload (multer + Cloudinary SDK); `weatherTags` field on items; owner dashboard UI built from the shared Button/Input/Card components — this is the first real page, and it sets the tone for consistency.
**Tell the agent:** build owner-scoped menu CRUD per the MenuItem schema, with Cloudinary image upload, checking `req.user.id === restaurant.ownerId` on every mutating route, using only the Phase 1 components for the UI.
**Explain before moving on:** why images live in Cloudinary and not Mongo; why ownership must be re-checked per request instead of trusted from login state.
**Done when:** owner adds/edits/deletes items with images uploading correctly; a different owner's token is rejected on someone else's restaurant.

### Phase 4 — Customer Ordering
**Goal:** end-to-end cart → order, no real payment yet.
**Tasks:** public menu view by restaurant/QR id; cart via Context; `POST /api/orders` creating an order at `pending_payment`; server recomputes total from DB prices, ignoring any price the client sends.
**Tell the agent:** implement the public menu view, cart, and order-creation endpoint per the Order schema — server must recompute price/quantity server-side and reject mismatches.
**Explain before moving on:** a concrete exploit this closes (a tampered request body setting an item's price to 1) and why recomputation, not just validation, is what stops it.
**Done when:** a full mock order completes; a manually tampered price gets silently recomputed, not trusted.

### Phase 5 — Real Payments
**Goal:** Razorpay integration with signature verification, not dependent on the client alone.
**Tasks:** create-order endpoint, client Razorpay checkout, verify endpoint (HMAC signature check), order flips to `confirmed` only after verification, handle cancel/failure; **also** a `/api/payments/webhook` endpoint verified against `RAZORPAY_WEBHOOK_SECRET` (a separate secret from the API key) as an independent confirmation path — the client-side verify call can simply never happen if the browser closes right after paying.
**Tell the agent:** integrate Razorpay per Section 3 — create-order, checkout, a verify endpoint that recomputes the HMAC signature server-side and only then confirms; also add a webhook endpoint that independently verifies and confirms payment, safe to run even if client-side verify already ran (check current status before flipping it again).
**Explain before moving on:** what the signature actually proves; why a webhook exists in addition to the client verify call, not instead of it; what should happen if verify and the webhook both fire for the same order.
**Why this matters:** this is what separates a real payment integration from a mocked one — the webhook is the detail most similar projects skip entirely.
**Done when:** a real test-mode payment completes and flips the order; a tampered signature is rejected; firing the webhook a second time for an already-confirmed order does nothing destructive.

### Phase 6 — Live Location + Decision Engine v1
**Goal:** compute ETA and a cook-start time using the free routing stack.
**Tasks:** client requests location permission and reads position via the Browser Geolocation API (`getCurrentPosition` at order time, `watchPosition` afterward); server wraps an OSRM route call in a `RoutingService`; `decisionEngine/eta.js` calls it; `decisionEngine/index.js` combines ETA + summed `prepTime` into `cookStartDelay`, stored in `order.cookingWindow`; if location permission is denied, fall back to a manual address field geocoded once via Nominatim (respecting its 1 req/sec limit and required `User-Agent` header).
**Tell the agent:** implement Decision Engine v1 per Section 6, Steps 1–4, using OSRM for routing and the Browser Geolocation API for the customer's live position; wrap the OSRM call so an outage degrades gracefully rather than crashing order creation; add the manual-address fallback path.
**Explain before moving on:** why ETA and prep time combine into one number instead of two independent timers; why HTTPS is required for geolocation in production; what the fallback should be if OSRM's public demo server is slow or down — a real risk with a free, non-SLA service.
**Done when:** creating an order returns an estimated cook-start and ready time using a real device location (or the manual fallback); a simulated OSRM outage doesn't break order creation.

### Phase 7 — Kitchen Display (KDS) + Realtime
**Goal:** kitchen sees a live queue; customer sees a live status.
**Tasks:** Socket.io server, rooms per `restaurantId`; KDS queue UI (dark, per Section 7) sorted by `cookStartDelay`; start/finish-cooking actions pushed via socket; customer tracking screen (light, countdown chip + Leaflet route) subscribed to its order's room.
**Tell the agent:** add Socket.io with rooms per restaurant and per order; build the Kitchen Display per the dark, ticket-rail direction in Section 7; the customer tracking screen subscribes and updates live, showing the countdown chip and a Leaflet map with the Section 6 route.
**Explain before moving on:** why rooms instead of broadcasting to every connected client; why the KDS is the one dark screen in the app; what happens to a client that reconnects after missing events (an honest gap worth naming, not a solved problem).
**Done when:** chef marks "started cooking" and the customer's screen updates without a refresh; the KDS is legibly readable from a few feet away — check it at actual viewing distance, not just at your desk.

### Phase 8 — Weather + Recommendations
**Goal:** menu re-ranks by weather; nothing is hidden.
**Tasks:** weather API call + `WeatherCache` (TTL index); scoring per Section 6, Step 6; applied at menu load only, never per-order.
**Tell the agent:** implement weather fetch with a 15-min TTL cache and the Step 6 scoring function; apply it only when the menu is loaded.
**Explain before moving on:** why re-rank instead of filter/hide; why the cache exists.
**Done when:** menu order visibly differs between two different cached weather conditions.

### Phase 9 — Continuous ETA
**Goal:** recheck loop with priority pushes on drift.
**Tasks:** `node-cron` safety-net sweep every N minutes for active orders, plus client-pushed location updates via socket; if drift exceeds threshold, recompute `cookStartDelay` and push a priority-change event; manual chef override that locks the order (`chefLocked: true`) out of further auto-adjustment. Every drift-triggered update must be a single atomic `findOneAndUpdate` matched on `{ _id: orderId, chefLocked: false }`, not a separate read-then-write.
**Tell the agent:** implement Step 5 of the Decision Engine — the recheck triggers, drift threshold logic, a socket event for priority changes, and the manual override endpoint. Use one atomic conditional `findOneAndUpdate` per update rather than reading the order, modifying it in memory, and saving it back.
**Explain before moving on — this is the single most complex phase in the whole build, know it cold:** the full loop from memory; what happens when two active orders' priorities cross mid-cook; why the override needs to persist; why the update itself is a single atomic conditional write instead of read-then-write — that's what actually prevents a lost update if the cron sweep and a manual override land at the same moment.
**Done when:** overriding your browser's location in devtools (or editing a mock coordinate) triggers a visible priority push on the Kitchen Display; firing the cron recheck and a manual override at the same time doesn't silently drop one of them.

### Phase 10 — Notifications
**Goal:** persisted notifications, read/unread state.
**Tell the agent:** per-user notification documents created on order status changes, a `read` flag, and an endpoint to mark read.
**Explain before moving on:** the push-vs-poll tradeoff you already avoided in Phase 7 by using sockets, and why persisted notifications still matter for a customer who closed their tab.
**Done when:** a status change creates a notification even for an offline client.

### Phase 11 — Analytics (Mongo rollups)
**Goal:** a fast owner dashboard without a second database.
**Tasks:** aggregation pipelines (`$group`, `$facet`, `$lookup`) for revenue by day/category, top items, peak hours, and weather-crossed reporting; a nightly `node-cron` job that runs the heavier pipelines once per restaurant per day and upserts the result into `AnalyticsRollup`; the dashboard reads from the rollup collection for historical ranges and only runs a live pipeline for "today so far."
**Tell the agent:** implement the reporting pipelines in Mongo only; the nightly job upserts one `AnalyticsRollup` document per restaurant per day; the dashboard reads pre-computed rollups for anything beyond today.
**Explain before moving on:** what an aggregation pipeline actually is (a sequence of stages, not one query), and how `$facet` computes several groupings in one pass; why precomputing nightly avoids re-running an expensive pipeline on every dashboard load.
**Done when:** the dashboard shows real revenue/top-items/peak-hours numbers, and a report crossing revenue against weather condition runs as a single aggregation.

### Phase 12 — Admin Panel
**Goal:** approval workflow, basic user management.
**Tell the agent:** admin role, restaurant-approval endpoint, basic user list/suspend actions, built from the Phase 1 components — kept deliberately plain per Section 7.
**Done when:** a new restaurant sits in "pending" until an admin approves it.

### Phase 13 — Security Hardening
**Goal:** an actual audit pass, not just a checkbox.
**Tasks:** rate-limit `/auth/*` (`express-rate-limit`); confirm every mutating route has a validator; grep for hardcoded secrets; confirm HTTPS on deployed URLs.
**Explain before moving on:** name 2–3 specific things you closed, not "I added security."

### Phase 14 — Testing
**Goal:** cover the failure paths, not just the happy path.
**Priority order if time-constrained:** payment failure/duplicate verify calls → expired/invalid token → OSRM/Weather API outage fallback (a real risk given both run on free/public infrastructure without an uptime guarantee) → GPS denied mid-order → chef offline mid-cook.

### Phase 15 — Deployment
**Goal:** a live, shareable link.
**Tasks:** client → Vercel; server → Render/Railway (HTTPS); MongoDB Atlas with backups on; all keys as host env vars; smoke-test every core flow against Section 11 before calling it done.
**Why this matters most:** a project someone can click into beats any amount of code they can't run. Don't skip this to build one more feature.

**Optional polish, only if real time remains (skip freely otherwise):** pagination (`?page=&limit=`) on list endpoints once test data grows past a page; a Postman collection or minimal Swagger doc exported alongside the repo; a single GitHub Actions workflow running your Phase 14 tests on push, if you got that far.

> **If you're short on time:** Phases 0–9 are the core build — don't cut into these. Phases 10–15 are ordered by priority; stop wherever your clock runs out.

---

## 9. API Endpoint Map

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/restaurants/:id
PATCH  /api/restaurants/:id          (owner)
POST   /api/restaurants/:id/menu     (owner)
PATCH  /api/menu/:itemId

POST   /api/orders                    → creates order, status = pending_payment
POST   /api/payments/create-order     → Razorpay order
POST   /api/payments/verify           → signature check → flips order to confirmed
POST   /api/payments/webhook          → independent confirmation path (Phase 5)
GET    /api/orders/:id                → live status (also pushed via socket)
PATCH  /api/orders/:id/cancel
POST   /api/orders/:id/location       → client-pushed live location updates (Phase 9)

GET    /api/weather?lat&lng           → cached
GET    /api/recommendations/:restaurantId

GET    /api/kitchen/queue             (chef/owner)
PATCH  /api/kitchen/orders/:id/status
PATCH  /api/kitchen/orders/:id/override   (chef manual override, Phase 9)

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/analytics/dashboard       (owner)
GET    /api/analytics/reports         (owner, Phase 11)

POST   /api/admin/restaurants/:id/approve   (Phase 12)
```

---

## 10. Non-Negotiable Rules

- Never trust a price or quantity sent from the frontend — recompute and validate server-side before charging.
- Never confirm an order until Razorpay's signature is verified server-side.
- Never store API keys or payment secrets in client code.
- Never treat one ETA calculation as final — it must be able to change.
- Never let automation fully remove chef override.
- Never phrase weather-based suggestions as health or medical advice.
- Never let a Weather or Routing (OSRM) API outage break ordering — fall back to a plain, unranked menu and a prep-time-only schedule.
- Never rely solely on the client-triggered payment verify call — a server-side webhook must independently confirm payment.
- Never update shared order state (Decision Engine fields) with a read-then-write — use a single atomic conditional update.
- Never introduce a new color, font, or spacing value outside the Section 7 tokens — extend the shared component set instead of styling a one-off.

---

## 11. Security / Testing / Deployment Checklists

**Security:** bcrypt hashing, JWT expiry + refresh rotation, role middleware on every protected route, Zod/Joi validation on every mutating endpoint, rate limiting on `/auth/*`, Helmet for secure headers, CORS locked to the client origin (never `*`), `express-mongo-sanitize` against NoSQL injection, structured request logging (morgan), HTTPS everywhere, secrets only in environment variables.

**Testing:** wrong/empty credentials, expired/blocked tokens, out-of-stock ordering, payment cancel/timeout/duplicate, GPS denied/disabled mid-order, OSRM/Weather API failure, chef offline, order cancelled mid-cook, notification delivery to an offline client.

**Deployment:** client → Vercel, server → Render/Railway with HTTPS, MongoDB Atlas (free tier) with backups enabled, all keys as env vars, staging check against this checklist before going live.

---

## 12. Suggested Build Order

1. Phase 0–1 in one sitting — a running skeleton with the design tokens and shared components already in place, before any real feature exists.
2. Phase 2–4 next — login, menu management, and a browsable, orderable cart — first real demoable milestone, and the first true test of whether Phase 1's components hold up across multiple pages.
3. Phase 5 (real payments) before anything else non-essential — the hardest integration, worth doing while you have energy and focus.
4. Phase 6–7 — live location + Decision Engine + Kitchen Display — this is where it stops looking like "another QR menu app."
5. Phase 8–9 — weather + continuous ETA — the actual differentiator; save it for once the plumbing already works.
6. Phase 10–11 as time allows — the nightly rollup job (Phase 11) is a small addition that keeps the dashboard fast as data grows, worth doing even if you're short on time.
7. Phase 12–15 last, in that order — never skip Phase 15.
