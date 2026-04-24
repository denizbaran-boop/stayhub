# StayHub — What Was Added

## 1. Project Overview

**StayHub** is a B2C Airbnb-like accommodation rental platform.
Stack: **React 18 + Vite** (client), **Node.js + Express + PostgreSQL** (server), **JWT** for auth, **plain CSS** with design tokens, **@react-google-maps/api** for maps.

The existing green-check features (registration, login, profile, destination search, date filtering, listing moderation, reservation requests, host approval, promo codes) are **preserved and integrated** with the new work — all new flows reuse the existing auth middleware, `bookings`, `properties`, `promotions`, and `reviews` tables/controllers.

This second pass adds **21 missing features** across guest, host, and admin roles, plus notifications, messaging, payments, payouts, 2FA, password recovery, an interactive map search, and platform analytics.

---

## 2. New Features Added

1. Host Portfolio
2. Public Profile View
3. User Management (Admin)
4. Two-Factor Auth (2FA)
5. Password Recovery
6. Guest Booking History
7. Credit Card Checkout
8. Host Payouts
9. Guest Reviews Property
10. Host Reviews Guest
11. Booking Confirmed Email
12. In-app Alerts / Notifications
13. Long-term Stay Discount
14. Platform Revenue Report
15. Host Earnings Stats
16. Interactive Search Map
17. Search as Map Moves
18. Pre-booking Inquiry
19. Threaded Inbox
20. Browse Featured Listings
21. Manage Availability

---

## 3. Feature Details

### 1) Host Portfolio
- **Role:** Host
- **What:** The existing Host Dashboard is extended so a host sees all their listings in a card grid with name, city/country, nightly price, status badge (`active`/`inactive`/`deleted`), rating, review count and quick actions (View, Edit, **Dates**, Delete).
- **Changed / Added:**
  - [client/src/pages/HostDashboard.jsx](client/src/pages/HostDashboard.jsx) — added nav links (Payouts, Earnings, Inbox), review-guest button, and "Dates" action on each listing card.
- **How:** Uses the existing `GET /api/properties` endpoint with aggregated stats (`active_bookings`, `avg_rating`, `review_count`).

### 2) Public Profile View
- **Role:** Guest, Host, Admin
- **What:** Clicking a user's name/avatar opens `/users/:id` — a public profile showing name, role, joined date, avatar, and a review summary. Hosts show their listings; guests show booking stats and host-written reviews.
- **Added:**
  - [server/controllers/userController.js](server/controllers/userController.js) — `getPublicProfile`
  - [server/routes/users.js](server/routes/users.js) — mounted at `/api/users/:id`
  - [client/src/pages/PublicProfilePage.jsx](client/src/pages/PublicProfilePage.jsx)
- **How:** Aggregates property list + rating for hosts; booking stats + host review summary for guests.

### 3) User Management (Admin)
- **Role:** Admin
- **What:** `/admin` page with a user table — filters by role, status, search — plus **activate/deactivate** and **delete**.
- **Added:**
  - [server/controllers/adminController.js](server/controllers/adminController.js) — `listUsers`, `setUserActive`, `deleteUser`, `getRevenueReport`
  - [server/routes/admin.js](server/routes/admin.js) — all routes behind `requireAdmin`
  - [client/src/pages/AdminUsersPage.jsx](client/src/pages/AdminUsersPage.jsx)
  - Added `is_active` column to `users` table; middleware blocks deactivated users from using their token.

### 4) Two-Factor Auth (2FA)
- **Role:** All
- **What:** When a user enables 2FA (from /settings), the next login returns a *challenge token* instead of a session token and sends a 6-digit code via the mock mailer. The user types the code on the login page to complete sign-in.
- **Added / Changed:**
  - New table `two_factor_codes`
  - [server/controllers/authController.js](server/controllers/authController.js) — `verifyTwoFactor`, `toggleTwoFactor`
  - [server/routes/auth.js](server/routes/auth.js) — `POST /api/auth/verify-2fa`, `PUT /api/auth/toggle-2fa`
  - [client/src/contexts/AuthContext.jsx](client/src/contexts/AuthContext.jsx) — login returns `{ twoFactorRequired, challengeToken, demoCode }` when required
  - [client/src/pages/LoginPage.jsx](client/src/pages/LoginPage.jsx) — second-step verification UI
  - [client/src/pages/SettingsPage.jsx](client/src/pages/SettingsPage.jsx) — toggle switch
- **Demo:** The server responds with `demo_code` so graders can complete the flow without a mailbox. The code is also visible in `server/logs/emails.log` and the server console.

### 5) Password Recovery
- **Role:** All
- **What:** "Forgot password?" link on login → email-entry page → mock email with reset link → reset form.
- **Added:**
  - New table `password_reset_tokens` (SHA-random 32-byte hex tokens, 1 hr expiry)
  - [server/controllers/authController.js](server/controllers/authController.js) — `requestPasswordReset`, `resetPassword`
  - [server/routes/auth.js](server/routes/auth.js) — `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
  - [client/src/pages/ForgotPasswordPage.jsx](client/src/pages/ForgotPasswordPage.jsx)
  - [client/src/pages/ResetPasswordPage.jsx](client/src/pages/ResetPasswordPage.jsx)
- **Demo:** `demo_token` is returned directly so you can click through without SMTP.

### 6) Guest Booking History
- **Role:** Guest
- **What:** The existing `GuestDashboard` already showed status-tabbed booking history. It was extended to link the Checkout flow and the Leave-Review form now sits alongside each completed booking card.
- **Files:** [client/src/pages/GuestDashboard.jsx](client/src/pages/GuestDashboard.jsx) (preserved/integrated)

### 7) Credit Card Checkout
- **Role:** Guest
- **What:** Dedicated `/checkout/:bookingId` page: cardholder, card number, expiry MM/YYYY, CVV. Client does live formatting, Luhn-check, and expiry validation; the server re-validates. On success the booking is confirmed, a payment row is written, a payout row is queued, the guest/host get notifications, and a booking-confirmation email is logged.
- **Added:**
  - New tables `payments` and `payouts`
  - [server/controllers/paymentController.js](server/controllers/paymentController.js) — `processPayment`, `getPaymentForBooking` (Luhn, brand detection, 10% commission split)
  - [server/routes/payments.js](server/routes/payments.js)
  - [client/src/pages/CheckoutPage.jsx](client/src/pages/CheckoutPage.jsx)
  - [client/src/components/BookingForm.jsx](client/src/components/BookingForm.jsx) — now navigates to `/checkout/:id` after booking
- **Demo-only:** no real payment gateway is called; `4242 4242 4242 4242` works for testing.

### 8) Host Payouts
- **Role:** Host
- **What:** `/dashboard/host/payouts` — summary cards (pending / released / lifetime) and a per-booking payout table with a Release button (demo action that flips status to `paid` and sets `payout_date`).
- **Added:**
  - [server/controllers/payoutController.js](server/controllers/payoutController.js) — `listHostPayouts`, `requestPayout`, `getHostEarnings`
  - [server/routes/payouts.js](server/routes/payouts.js)
  - [client/src/pages/HostPayoutsPage.jsx](client/src/pages/HostPayoutsPage.jsx)
- **How:** A `payouts` row is auto-created whenever a guest pays. 10% commission is subtracted.

### 9) Guest Reviews Property
- **Role:** Guest
- **Status:** The existing `/api/reviews` endpoint + `ReviewForm` already did this. **Integrated** into the new checkout + booking flows; reviews are shown on the property page and on the guest's public profile.

### 10) Host Reviews Guest
- **Role:** Host
- **What:** On confirmed/completed bookings in the Host Dashboard, a **Review Guest** button opens a star-rating form. The guest then sees these reviews on their public profile.
- **Added:**
  - New table `host_reviews`
  - [server/controllers/hostReviewController.js](server/controllers/hostReviewController.js)
  - [server/routes/hostReviews.js](server/routes/hostReviews.js)
  - [client/src/components/HostReviewForm.jsx](client/src/components/HostReviewForm.jsx)
  - [client/src/pages/PublicProfilePage.jsx](client/src/pages/PublicProfilePage.jsx) — renders received reviews

### 11) Booking Confirmed Email
- **Role:** Guest
- **What:** A mock `mailer` service writes the email to the server console **and** appends it to `server/logs/emails.log`. Body includes booking ID, property title, host name, check-in/out dates, total, status.
- **Added:**
  - [server/services/mailer.js](server/services/mailer.js)
  - [server/controllers/paymentController.js](server/controllers/paymentController.js) calls `bookingConfirmationEmail(...)` after a successful payment.

### 12) In-app Alerts / Notifications
- **Role:** All
- **What:** A bell icon in the navbar shows unread counts, lists recent notifications, and links each one to the relevant page (Dashboard, Payouts, Inbox…). Polls every 30s.
- **Added:**
  - New table `notifications`
  - [server/services/notifier.js](server/services/notifier.js) — shared helper used by bookings, payments, payouts, messages, and host-reviews
  - [server/controllers/notificationController.js](server/controllers/notificationController.js)
  - [server/routes/notifications.js](server/routes/notifications.js)
  - [client/src/components/NotificationsBell.jsx](client/src/components/NotificationsBell.jsx)
  - Hooked into Navbar.

### 13) Long-term Stay Discount
- **Role:** Guest (automatic)
- **What:** 7+ nights → 10% off; 30+ nights → 20% off. Shown as a separate line in the booking price breakdown and in the checkout summary, and stacked with any promo code before final price.
- **Changed:**
  - [server/controllers/bookingController.js](server/controllers/bookingController.js) — added `longStayDiscountRate()`, `previewPrice`, and updated `createBooking` to apply the discount.
  - [client/src/components/BookingForm.jsx](client/src/components/BookingForm.jsx) — mirrors the server-side logic in the UI.
  - New route: `POST /api/bookings/preview` for live previews.

### 14) Platform Revenue Report
- **Role:** Admin
- **What:** `/admin/revenue` page shows total platform revenue, commission revenue (10% of bookings), confirmed/completed/cancelled counts, user/host/guest/property counts, a 12-month bar chart, top hosts table, and recent transactions.
- **Added:**
  - [server/controllers/adminController.js](server/controllers/adminController.js) — `getRevenueReport`
  - [client/src/pages/AdminRevenuePage.jsx](client/src/pages/AdminRevenuePage.jsx) — uses a lightweight CSS bar chart (no chart library required).

### 15) Host Earnings Stats
- **Role:** Host
- **What:** `/dashboard/host/earnings` — total earnings, completed bookings, pending bookings, avg. booking value, pending payout, paid payout, monthly bar chart, and revenue by property table.
- **Added:**
  - [server/controllers/payoutController.js](server/controllers/payoutController.js) — `getHostEarnings`
  - [client/src/pages/HostEarningsPage.jsx](client/src/pages/HostEarningsPage.jsx)

### 16) Interactive Search Map
- **Role:** Guest
- **What:** `/map-search` page — listings appear as price-tag markers on a Google Map. Clicking a marker opens an InfoWindow with photo, price, rating, and a "View Details" button. A synced sidebar list updates alongside.
- **Added:**
  - [client/src/pages/MapSearchPage.jsx](client/src/pages/MapSearchPage.jsx)
  - Navbar "Map" link.

### 17) Search as Map Moves
- **Role:** Guest
- **What:** On `/map-search`, when the map is panned/zoomed, listings re-fetch for the visible bounding box. There's a toggle "Search as map moves" (debounced 600ms); when off, a **Search this area** button appears.
- **Added / Changed:**
  - [server/controllers/searchController.js](server/controllers/searchController.js) — accepts `ne_lat, ne_lng, sw_lat, sw_lng` bbox params and a `featured` filter.
  - MapSearchPage uses `map.getBounds()` → API `/api/search`.

### 18) Pre-booking Inquiry
- **Role:** Guest (sends), Host (receives)
- **What:** An inquiry box appears on each listing's detail page: "Ask {Host} a question". Submitting creates a conversation and sends the first message. The host is notified via in-app alert and email log.
- **Added:**
  - [client/src/components/InquiryForm.jsx](client/src/components/InquiryForm.jsx)
  - [server/controllers/messageController.js](server/controllers/messageController.js) — `createInquiry` (wrapper over `sendMessage`)
  - `POST /api/messages/inquiry`

### 19) Threaded Inbox
- **Role:** Guest, Host
- **What:** `/inbox` — left sidebar lists conversations by unread/most-recent; right pane shows a chat thread with bubble messages, sender avatars, and a reply input. Messages from the other party are auto-marked read when the thread is opened.
- **Added:**
  - New tables `conversations` and `messages`
  - [server/controllers/messageController.js](server/controllers/messageController.js)
  - [server/routes/messages.js](server/routes/messages.js)
  - [client/src/pages/InboxPage.jsx](client/src/pages/InboxPage.jsx)

### 20) Browse Featured Listings
- **Role:** Any
- **What:** `/featured` page shows hand-picked listings (`is_featured = TRUE`) plus high-rated ones. The homepage already uses the featured endpoint; admin can flip the flag via `PUT /api/properties/:id`.
- **Added / Changed:**
  - `is_featured` column on `properties`
  - [server/controllers/propertyController.js](server/controllers/propertyController.js) — sort now prioritizes `is_featured DESC`
  - [client/src/pages/FeaturedPage.jsx](client/src/pages/FeaturedPage.jsx)

### 21) Manage Availability
- **Role:** Host
- **What:** `/dashboard/host/properties/:id/availability` — a month calendar where the host clicks dates to select them, then blocks or unblocks them in bulk. Booked dates are shown in red and are not editable. Blocks flow through to both the booking form date picker and the search engine (via existing `bookings ∪ availability` logic).
- **Added:**
  - [client/src/pages/ManageAvailabilityPage.jsx](client/src/pages/ManageAvailabilityPage.jsx) — consumes existing `GET /api/availability/:id`, `POST /api/availability/:id`

---

## 4. Demo Flow (for presentation)

This flow exercises every major feature path. All emails/notifications are visible in the server console and `server/logs/emails.log`.

1. **Guest searches a listing.** Log in as `john@example.com / password123`. From the homepage, use the SearchBar ("New York", dates, 2 guests) — existing **destination search** and **date filtering** pages load results. Switch to the **Map** link for the interactive map view; pan around and watch listings refresh ("Search as map moves").

2. **Guest asks a pre-booking inquiry.** Open a listing (e.g., *Mountain Cabin Retreat*). In the sidebar, type a question in "Ask Sarah a question" and send — the host receives a notification and the conversation appears in John's **Inbox**.

3. **Guest books.** Pick dates that span **9 nights** (to trigger the 10% long-stay discount), optionally apply promo code `WELCOME10` for an additional 10% off the subtotal, then click **Reserve**. The app navigates to `/checkout/:bookingId`.

4. **Guest checks out.** Fill in `John Smith / 4242 4242 4242 4242 / 12 / 2028 / 123` → **Pay**. The payment succeeds, the booking is auto-confirmed, a payout is queued for Sarah, and a confirmation email is logged. The Success screen shows booking ID, dates, and total.

5. **Host sees it.**  Log in as `sarah@example.com / password123`. The bell shows a *New booking request* / *Payment received* alert. The **Host Dashboard** lists the booking with guest info. Click **Payouts** to see the queued payout; click **Release** to mark it paid.

6. **Earnings stats.** From the dashboard, click **Earnings** to see the monthly chart, by-property table, and all-time KPIs (total earnings, completed bookings, avg. booking value).

7. **Reviews.** Back in the booking list, click **Mark Completed** (if needed), then **Leave Review** as John from the Guest Dashboard, and **Review Guest** as Sarah from the Host Dashboard. Both appear on the corresponding public profiles at `/users/:id`.

8. **Admin.** Log in as `admin@example.com / password123`. Navigate to **/admin** to see all users, filter by role or status, deactivate/activate/delete. Switch to **Revenue** to see the platform report, 12-month revenue chart, top hosts, and recent transactions.

9. **2FA.** From the top-right menu → **Security** → **Enable 2FA**. Log out and log back in — a verification step appears, with the demo code shown inline and also in `server/logs/emails.log`.

10. **Forgot password.** Log out. Click **Forgot password?** → enter any seeded email → use the demo reset link → set a new password.

Throughout the flow, the bell icon surfaces new notifications, and the **Featured** page (navbar) shows highlighted listings.

---

## 5. Preserved Existing Features

Every green-check feature still works and is **integrated** into the new surfaces:

- Registration / Login / Auth — unchanged public API, extended with 2FA and profile fields
- Profile Setup — still `PUT /api/auth/profile`
- Destination Search & Date Filtering — same `GET /api/search` (extended with bbox params)
- Listing Moderation — Host Dashboard properties section
- Reservation Request — `POST /api/bookings` still works; now links into Checkout
- Host Approval — unchanged (`PATCH /api/bookings/:id/status`), now sends notifications
- Apply Promo Code — stacks with the new long-stay discount (promo applied after long-stay discount)

---

## 6. Changed / Added Files Summary

### Database
- [server/database/schema.sql](server/database/schema.sql) — added columns (`is_active`, `two_factor_enabled`, `is_featured`) and 8 new tables (`password_reset_tokens`, `two_factor_codes`, `notifications`, `conversations`, `messages`, `payments`, `payouts`, `host_reviews`) with indexes
- [server/database/seed.sql](server/database/seed.sql) — added admin user, demo notifications, demo conversation/messages, seed payout + payment + host review, featured-flag updates
- [server/database/migrate.js](server/database/migrate.js) — admin credentials banner

### Server — New controllers and routes
- [server/services/notifier.js](server/services/notifier.js), [server/services/mailer.js](server/services/mailer.js)
- [server/controllers/notificationController.js](server/controllers/notificationController.js) + [routes/notifications.js](server/routes/notifications.js)
- [server/controllers/messageController.js](server/controllers/messageController.js) + [routes/messages.js](server/routes/messages.js)
- [server/controllers/paymentController.js](server/controllers/paymentController.js) + [routes/payments.js](server/routes/payments.js)
- [server/controllers/payoutController.js](server/controllers/payoutController.js) + [routes/payouts.js](server/routes/payouts.js)
- [server/controllers/hostReviewController.js](server/controllers/hostReviewController.js) + [routes/hostReviews.js](server/routes/hostReviews.js)
- [server/controllers/userController.js](server/controllers/userController.js) + [routes/users.js](server/routes/users.js)
- [server/controllers/adminController.js](server/controllers/adminController.js) + [routes/admin.js](server/routes/admin.js)

### Server — Changed
- [server/server.js](server/server.js) — wires in the new routes
- [server/middleware/auth.js](server/middleware/auth.js) — blocks deactivated users
- [server/controllers/authController.js](server/controllers/authController.js) — 2FA, password reset
- [server/routes/auth.js](server/routes/auth.js) — 2FA + reset routes
- [server/controllers/bookingController.js](server/controllers/bookingController.js) — long-stay discount, `previewPrice`, notifications on create / status changes, host-review field in host-bookings query
- [server/routes/bookings.js](server/routes/bookings.js) — `/preview` route
- [server/controllers/searchController.js](server/controllers/searchController.js) — bbox params, `featured` filter
- [server/controllers/propertyController.js](server/controllers/propertyController.js) — admin-editable `is_featured`, featured-first ordering

### Client — New pages and components
- [client/src/pages/ForgotPasswordPage.jsx](client/src/pages/ForgotPasswordPage.jsx)
- [client/src/pages/ResetPasswordPage.jsx](client/src/pages/ResetPasswordPage.jsx)
- [client/src/pages/CheckoutPage.jsx](client/src/pages/CheckoutPage.jsx)
- [client/src/pages/PublicProfilePage.jsx](client/src/pages/PublicProfilePage.jsx)
- [client/src/pages/AdminUsersPage.jsx](client/src/pages/AdminUsersPage.jsx)
- [client/src/pages/AdminRevenuePage.jsx](client/src/pages/AdminRevenuePage.jsx)
- [client/src/pages/HostPayoutsPage.jsx](client/src/pages/HostPayoutsPage.jsx)
- [client/src/pages/HostEarningsPage.jsx](client/src/pages/HostEarningsPage.jsx)
- [client/src/pages/InboxPage.jsx](client/src/pages/InboxPage.jsx)
- [client/src/pages/ManageAvailabilityPage.jsx](client/src/pages/ManageAvailabilityPage.jsx)
- [client/src/pages/MapSearchPage.jsx](client/src/pages/MapSearchPage.jsx)
- [client/src/pages/FeaturedPage.jsx](client/src/pages/FeaturedPage.jsx)
- [client/src/pages/SettingsPage.jsx](client/src/pages/SettingsPage.jsx)
- [client/src/components/NotificationsBell.jsx](client/src/components/NotificationsBell.jsx)
- [client/src/components/InquiryForm.jsx](client/src/components/InquiryForm.jsx)
- [client/src/components/HostReviewForm.jsx](client/src/components/HostReviewForm.jsx)

### Client — Changed
- [client/src/App.jsx](client/src/App.jsx) — added routes for all new pages, new `AdminRoute` guard
- [client/src/contexts/AuthContext.jsx](client/src/contexts/AuthContext.jsx) — 2FA-aware `login`, added `verifyTwoFactor`
- [client/src/pages/LoginPage.jsx](client/src/pages/LoginPage.jsx) — 2FA step, Forgot-password link, admin demo account
- [client/src/components/Navbar.jsx](client/src/components/Navbar.jsx) — notifications bell, Featured/Map/Inbox/Security/Profile links, admin dropdown
- [client/src/components/BookingForm.jsx](client/src/components/BookingForm.jsx) — long-stay discount, navigate to `/checkout/:id`
- [client/src/pages/PropertyDetailPage.jsx](client/src/pages/PropertyDetailPage.jsx) — host name/avatar links to public profile, inline `InquiryForm`
- [client/src/pages/HostDashboard.jsx](client/src/pages/HostDashboard.jsx) — Payouts/Earnings/Inbox links, Review-Guest button, Manage-dates link

---

## 7. Setup / Migration Commands

From `/Users/deniz/Documents/PotatoProject`:

```bash
# (first time only)
npm run install:all

# Apply schema + seed data (idempotent; ALTER TABLE / CREATE TABLE IF NOT EXISTS only)
cd server && node database/migrate.js --seed
cd ..

# Start both server and client
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5001
```

No extra dependencies are needed — the work reuses the already-installed `pg`, `bcryptjs`, `jsonwebtoken`, `@react-google-maps/api`, `react-calendar`, and `react-datepicker`.

**Environment (optional, for the map):** put in `client/.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```
Without it, the map shows a friendly fallback and the list still works.

---

## 8. Limitations & Demo-only Parts

- **Payments:** No real gateway. The checkout validates card format (Luhn), issues a fake success, and records the last-4 only. Try `4242 4242 4242 4242` / any future expiry / any 3-digit CVV.
- **Emails:** A **mock mailer** writes to the server console and to `server/logs/emails.log` (auto-created). For demo convenience, the server also returns the **2FA code** and **password-reset token** inline in the API response (`demo_code`, `demo_token`) so graders can complete the flow without a real mailbox. In production, remove those fields.
- **Host payouts:** "Release" flips the row to `paid` — no real bank transfer.
- **Commission:** Flat 10% split, computed at payment time, stored on the payout row.
- **Map:** If `VITE_GOOGLE_MAPS_API_KEY` is not set, the map view shows a fallback panel; the sidebar list still works.
- **Notifications:** Polled every 30s (no WebSocket / SSE).
- **Admin "delete user":** hard-delete with `ON DELETE CASCADE`; the admin can't delete themselves.

---

## 9. Step-by-step Testing Guide

1. **Bootstrap**
   - `node database/migrate.js --seed` from `server/`
   - `npm run dev` from the repo root

2. **Login as host & admin**
   - `sarah@example.com / password123` — Host Sarah (5 properties seeded)
   - `admin@example.com / password123` — Admin (new) to test admin pages
   - `john@example.com / password123` and `emily@example.com / password123` — guests

3. **Test Host Portfolio + Manage Availability**
   - As Sarah, go to `/dashboard/host` → Listings tab
   - Click **Dates** on any listing; select dates, **Block** them
   - Go to that listing as a guest — those dates are now disabled in the booking calendar

4. **Test Inquiry + Inbox**
   - As John, open any Sarah listing → **Ask Sarah a question** → send
   - Log out → log in as Sarah → bell shows a *New message* alert → click it to land in `/inbox/:id` → reply

5. **Test Booking + Long-stay discount + Checkout + Email + Payout**
   - As John, book **9+ nights** (or 30+) → see discount in breakdown → click Reserve → pay on `/checkout/:id`
   - See the success page; open `server/logs/emails.log` — confirmation email present
   - Log in as Sarah → **Payouts** shows the new pending payout

6. **Test Reviews**
   - As Sarah, **Mark Completed** the booking → **Review Guest**
   - As John, from the Guest Dashboard → **Leave Review** on the same booking
   - Visit `/users/<host_id>` and `/users/<guest_id>` — reviews render

7. **Test Admin**
   - As admin, `/admin` → toggle a user's status → confirm `/api/auth/profile` 401s if you use that user's token
   - `/admin/revenue` — see charts, counts, top hosts, recent transactions

8. **Test 2FA**
   - Any user → top menu → Security → Enable 2FA → log out → log in → enter the `demo_code` shown → you should end up authenticated

9. **Test Password Recovery**
   - Log out → `/forgot-password` → enter email → click the demo link → set a new password → log in with it

10. **Test Map Search**
    - `/map-search` → pan / zoom → the sidebar list refreshes (or click *Search this area* with the toggle off)

11. **Test Featured Listings**
    - `/featured` — Villa and Beach House are seeded as `is_featured = TRUE`

12. **Test Notifications**
    - Perform a booking action; within 30s the bell updates. Click bell → click a notification → navigated to the linked page & marked read.
