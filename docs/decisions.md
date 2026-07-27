# SRE Decisions Log

A running record of what was built in each phase and why.

---

## Phase 0 — Setup
**What:** Scaffolded the MERN project with `client/` (Vite + React + Tailwind) and `server/` (Express + Mongoose). Added baseline security middleware — helmet for HTTP headers, cors locked to the client origin only, express-mongo-sanitize to strip `$`-operator payloads from request bodies, and morgan for request logging. Created a `GET /api/health` endpoint that pings MongoDB and reports connection status.

**Why:** The skeleton needs to boot and connect before anything else matters. Locking cors to `CLIENT_URL` instead of `*` prevents any other origin from hitting the API. express-mongo-sanitize is here from day one because NoSQL injection (e.g., `{"email": {"$gt": ""}}` in a login body) is trivially easy to attempt and trivially easy to block — there's no reason to leave the door open even for a single phase. The health check includes a DB ping so we can distinguish "server is up" from "server is up but database is unreachable."

---

## Phase 1 — Design Foundations & Shared Components
**What:** Implemented the exact design tokens (ink, steel, surface, ember, herb, rail) and typography from Section 7 into `tailwind.config.js`. Built all shared UI components (`Button`, `Input`, `Card`, `Badge`, `Toast`, `Skeleton`, `EmptyState`, `CountdownChip`) with their specified states, and created an internal `/dev/styleguide` page to visually verify them all together.

**Why:** A shared, built-once component layer is what actually prevents inconsistent-looking pages later, far more effectively than any individual phase's effort.

## Phase 2 — Auth & Core Data
**What:** Created all MongoDB schemas (`User`, `Restaurant`, `MenuItem`, `Order`, `Payment`, `Notification`, `Inventory`, `WeatherCache`, `AnalyticsRollup`). Built JWT access/refresh token issuance, registration, login, and token refresh endpoints. Added `authMiddleware` to verify tokens server-side, `requireRole` middleware for RBAC, and Zod validation middleware. Wrote `seed.js` to initialize the database with an owner, a chef, a restaurant, and menu items.

**Why:** We issue an access/refresh token pair because access tokens should be short-lived for security, while refresh tokens provide good UX by keeping users logged in without constantly asking for passwords. We verify roles server-side on every request because checking roles only client-side to hide UI buttons can easily be bypassed via API requests.

## Phase 3 — Restaurant & Menu Management
**What:** Implemented `MenuItem` CRUD endpoints scoped to the restaurant owner. Configured `multer` with `multer-storage-cloudinary` to handle image uploads. Built the `OwnerDashboard` and `MenuManagementPage` in React, strictly using the Phase 1 component layer.

**Why:** Images are stored in Cloudinary because storing binary files (Base64 or Buffers) in MongoDB bloats document size and severely impacts query performance. Ownership is explicitly checked on every mutating request (`req.user.id === restaurant.ownerId`) because trusting the client to only edit what it owns is fundamentally insecure.

## Phase 4 — Customer Ordering
**What:** Built the customer-facing `MenuPage`, `CheckoutPage`, and `OrderTrackingPage`. Implemented the `POST /api/orders` endpoint which receives the cart contents and creates the order document.

**Why:** The non-negotiable rule from Section 10 is enforced here: the server completely ignores the price sent by the client. It iterates over the requested item IDs, fetches the true `price` and `available` status directly from MongoDB, and computes the `totalPrice` server-side. This mathematically prevents price manipulation.

## Phase 5 — Real Payments
**What:** Integrated Razorpay on both the client (`CheckoutPage` dynamically loads the SDK) and server (`paymentController.js` handles order creation, signature verification, and webhooks). Added the `Payment` schema to track transactions.

**Why:** We must use Razorpay per the non-negotiable rule. Double-verification is implemented: the client verifies the signature immediately for good UX, but a raw-body webhook endpoint acts as the absolute source of truth in case the client drops off before verifying.

## Phase 6 — Live Location & Decision Engine v1
**What:** Modified `CheckoutPage` to request Browser Geolocation before placing an order. Built `DecisionEngine.js` which takes the customer's coordinates and the restaurant's coordinates, queries the public OSRM API for true driving ETA, and subtracts the menu item `prepTime` to calculate the optimal `cookStartDelay`.

**Why:** Using Leaflet/OSRM fulfills the manual's constraint to avoid Google Maps. The Decision Engine ensures food is hot exactly when the customer arrives, rather than sitting on a counter getting cold if they are far away.

## Phase 7 — KDS & Real-time Sync
**What:** Integrated Socket.IO on the Express server and `socket.io-client` in React. Built the Kitchen Display System (`KDSPage`) using the dark `ink` background. Configured socket rooms (`kitchen_${restaurantId}`) so the kitchen gets new orders instantly upon payment verification, and the customer (`order_${orderId}`) gets live status updates.

**Why:** A commercial kitchen cannot refresh a webpage to see new orders; it must push. The dark UI for KDS is specifically designed to reduce glare and eye fatigue in bright, stainless-steel kitchen environments.

## Phase 8 — Weather & Recommendations
**What:** Built `weatherService.js` to fetch live data from OpenWeatherMap, cache it in `WeatherCache` (using MongoDB's TTL index to auto-delete after 15 mins), and attached weather tracking to menu queries. Items matching the current weather receive a +50 `popularityScore` boost and are flagged with an `isGoodPick` UI tag.

**Why:** Menu re-ranking must be completely server-side. The 15-minute TTL cache mathematically bounds the number of external API calls (max 4 per hour per location cluster), preventing rate-limiting from the weather provider while maintaining reasonably fresh data.

## Phase 9 — Continuous ETA
**What:** Used `navigator.geolocation.watchPosition` to push customer live location to the server via Socket.IO. Set up a `node-cron` job (`etaSweep.js`) to periodically recalculate the ETA for all active orders to detect drift. Added a manual "Override ETA" button to the KDS UI for chefs.

**Why:** A single point-in-time ETA calculation at checkout is insufficient because traffic changes and customers deviate. Continuous monitoring handles this. The chef override is necessary because real-world kitchen delays (e.g., dropping a plate) require manual intervention.

## Phase 10 — Notifications
**What:** Integrated the `Notification` schema. When an order's `cookingStatus` is updated to `ready` in KDS, the backend creates a Notification document and emits a `notification` socket event to the customer. Added an in-app notification tray with a bell icon to `CustomerLayout`.

**Why:** Ensures customers are instantly alerted when their food is hot and ready, preventing food degradation while they wait oblivious. Storing them in MongoDB provides a history of alerts if they close the app.

## Phase 11 — Rollup & Analytics
**What:** Created a `nightlyRollup.js` cron job that runs at midnight to aggregate completed orders from the previous day into the `AnalyticsRollup` collection. It also increments the `popularityScore` of each ordered `MenuItem`. Built the `AnalyticsPage` to show today's live revenue/orders (calculated on-the-fly) alongside the 7-day historical rollup.

**Why:** Running heavy MongoDB `$group` pipelines on all orders in real-time is unscalable. Pre-aggregating data nightly into `AnalyticsRollup` ensures the dashboard loads instantly for owners while keeping today's metrics live.

## Phase 12 — Admin Panel & Impersonation
**What:** Built the `AdminDashboard` and corresponding endpoints (`/api/admin/*`) strictly protected by the `admin` role. Added system-wide metrics (users, restaurants, orders). Implemented the Impersonation feature, which allows an admin to generate and receive a new JWT signed with the target user's ID/Role.

**Why:** Admins need a bird's-eye view of the system. Impersonation is the most efficient way to debug customer or owner issues without needing their password or building complex "view-as" states in the UI. We simply issue a real token for that user.

## Phase 13 — Security Hardening & CI/CD
**What:** Implemented Helmet for HTTP headers, MongoSanitize for NoSQL injection prevention, and `express-rate-limit` for brute-force protection on `/auth` routes. Added `.prettierrc` for consistent styling and a `.github/workflows/main.yml` for continuous integration.

**Why:** Security must be multi-layered. Rate limiting prevents credential stuffing, while Helmet/Sanitize prevent common web vulnerabilities. CI/CD ensures code quality automatically before deployment.

## Phase 14 — Deployment
**What:** Created a `Dockerfile` for the Node backend and a multi-stage `Dockerfile` for the React frontend (built and served via NGINX with routing support). Wrote a comprehensive `docker-compose.yml` that orchestrates Mongo, Server, and Client networking.

**Why:** Containerization ensures "works on my machine" translates flawlessly to production. NGINX efficiently serves the static frontend assets while reverse-proxying API calls to the Node container.

## Phase 15 — System Audit
**What:** Completed end-to-end review of the build matching `SRE-Build-Manual.md`. Scubbed the codebase, verified the strict non-negotiable rules (OSRM only, Mongo only, strict design tokens).

**Why:** Final verification guarantees the exact specifications were met without hallucinated drift. The Smart Restaurant Ecosystem is now complete and fully functional.










