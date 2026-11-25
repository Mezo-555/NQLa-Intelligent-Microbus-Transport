# NQLa Track 1 Mobile App — Design & Architecture Specification

* **Author:** YakootShaker
* **Status:** Proposed
* **Date:** 2026-11-26

--------------------------------------------------------------------------------

## Overview

NQLa (نقلة) is a Flutter mobile application (`apps/mobile-app`, Dart package `mobile_app`) for two user groups in Alexandria, Egypt: **riders** (aged 20–30, daily commuters and university students on mid-range Android phones) and **informal microbus drivers** (aged 20–40, using mounted personal Android smartphones).

Unlike previous minibus platforms such as Swvl—which chartered vehicles, burned capital on fare subsidies, and required pre-scheduled seat bookings—NQLa owns zero vehicles, pays zero fare subsidies, and organizes the informal routes that already operate in Alexandria. Track 1 Mobile App covers the Rider and Driver mobile experiences only; the web-based Admin Dashboard (`apps/admin-dashboard`) and backend/AI services (`backend/`, `ai_services/`) live in separate modules and tracks.

| Dimension | Swvl (Previous Model in Egypt) | NQLa Mobile App (This Design) |
| :--- | :--- | :--- |
| **Fleet Ownership** | Chartered buses; lost money on empty seats | Zero vehicles owned; organizes existing independent drivers |
| **Pricing & Subsidies** | Heavy fare subsidies competing against ride-hailing | Zero subsidies; displays official route tariffs upfront |
| **Booking vs. Street Hail** | Fixed scheduled pickup points with cancellation friction | Live corridor visibility + eyes-free audio proximity alerts |
| **Infrastructure Cost** | Commercial mapping and high cloud overhead | Open-source stack (`OpenStreetMap`, `PostGIS`, `FastAPI`) |

## The Problem

Alexandria's microbus network carries millions of trips without fixed timetables, digital route maps, or shared visibility between waiting riders and moving drivers. Field interviews with riders and drivers surfaced five concrete daily failures:

1. **No Route or Transfer Visibility (Riders):** Microbuses have no fixed stops—riders stand along a street with no way to know whether any line on that road reaches their destination, or how to combine multiple lines with walking segments when no direct microbus exists.
2. **Undocumented Hand-Signal Barrier (Riders):** More than 10 local destination hand signals exist by word of mouth. Riders who do not know the signal must flag down every passing microbus and ask the driver verbally.
3. **Unknown Wait Times (Riders):** Standing on a road offers zero visibility into whether a microbus on the needed line is two minutes away or nowhere nearby.
4. **Fare Disputes and Missing Change (Riders & Drivers):** Drivers sometimes raise fares arbitrarily without an objective reference, and drivers frequently lack 1–2 EGP coins for change, keeping the extra money and causing arguments with riders.
5. **Cash Handling Distraction (Drivers):** Drivers collect fares and count small change across up to 14 passengers while driving manual vehicles in dense traffic.

**Proposed Solution:**
NQLa addresses these problems through three mobile capabilities backed by zero in-vehicle hardware (`BR-08`):
1. **Route Discovery & Multi-Transfer Planning:** Bilingual search (Egyptian Arabic, Franco-Arabic, English) returning step-by-step journeys ("ride Line X to Landmark A, walk 5 minutes to Landmark B, ride Line Y to destination") with upfront official fares.
2. **Live Microbus Visibility & Eyes-Free Pickup Alerts:** Real-time microbus locations on an OpenStreetMap map for riders, paired with throttled Egyptian Arabic spoken (TTS) alerts to drivers when waiting NQLa riders are ahead on their route.
3. **Simulated Cashless Wallet with Cabin QR + 4-Digit Code:** Upfront fare calculation plus an in-app wallet transfer triggered by scanning a cabin QR sticker or entering a printed 4-digit vehicle code (placed in front and back rows), confirmed via spoken Egyptian Arabic TTS on the driver's phone so the driver never reads the screen while driving.

## Goals

### Milestone 1: Increment I Demo (2-Week Target)
* **Independent Track 1 Demo:** Deliver a runnable Flutter app on an Android phone using simulated local data (since `backend/` is currently empty) that demonstrates the three core loops end-to-end:
  1. Interactive Alexandria OpenStreetMap view with bilingual stop/corridor search and single/multi-transfer route display.
  2. Simulated real-time microbus movement along Alexandria corridors with live map markers and rider-proximity TTS trigger simulation.
  3. Simulated rider-to-driver wallet balance transfer via cabin QR / 4-digit code check-in with spoken Egyptian Arabic TTS receipt on the Driver view.
* **Contract-First Foundation:** Lock v1 JSON schemas in `docs/api_contracts/` and isolate simulated data behind repository interfaces so Track 2 FastAPI/PostGIS/WebSocket endpoints swap in without UI rewrites.

### Milestone 2: Final Graduation Defense (5+ Month Target)
* **Complete Rider & Driver Journeys:** Integrate authentication and role guards, live Track 2 PostGIS multi-transfer routing (`BR-02`), live WebSocket GPS tracking and ride matching (`BR-01`, `BR-08`), Egyptian/Franco-Arabic feedback submission (`BR-06`), driver safety score views (`BR-05`), driver demand heatmaps and incentive alerts (`BR-03`, `BR-04`), and the Transportation AI Agent chat UI.
* **Field Reliability:** Operate reliably on mid-range Android devices over spotty Egyptian 3G/4G connections with cached Alexandria map tiles, battery-safe foreground GPS tracking, and full RTL Arabic support.
* **Traceability & Team Handoff:** Document architecture, data models, and `BR -> UR -> FR` mappings so teammates, Prof. Saleh Mesbah, QA testers, and coding agents share one source of truth.

## Non-Goals

* **Web Admin Dashboard (`apps/admin-dashboard`):** Out of scope here; tracked separately in [track1_admin_web_spec.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/docs/track1_admin_web_spec.md).
* **Live Payment Gateway & Real Money Custody:** Integrating real bank cards, Central Bank of Egypt (CBE) e-money licensing, or live Fawry cash-out settlement is excluded from the graduation prototype. All wallet loads and transfers operate on simulated test credits (`Test Credits`) until a licensed payment service provider (PSP) is integrated post-graduation.
* **Hand-Signal Tutorial UI (Increment I):** Teaching >10 local hand signals in-app is excluded per product decision, relying instead on rider map visibility and driver audio proximity alerts (to be revisited only if field pilots show partial driver adoption leaves riders stranded).
* **Production Play Store Packaging Split:** Splitting `rider` and `driver` into separate Google Play binaries/flavors for background-location policy review is deferred until production rollout, while keeping code modules strictly decoupled now.
* **Dedicated Vehicle Hardware (`BR-08`):** No OBD-II trackers, NFC readers, or dash terminals; only printed QR/4-digit cabin stickers and smartphones are permitted.
* **Client-Side Routing, ML, or NLP Execution:** Track 1 mobile never runs graph routing, demand forecasting, safety scoring, or LLM tool-calling locally; Track 2 (`backend/`) serves as the single API gateway for Tracks 2, 3, and 4.
* **Operations Outside Alexandria:** Routes, stops, and map tile caches target Alexandria governorate only.

## Open Questions

* **Question 1 (Alexandria Seed Dataset Ownership):** Who across Track 1 and Track 2 is assembling and verifying the ground-truth coordinates, landmarks, and official fares for the initial 4–6 Alexandria corridors used in Increment I?
* **Question 2 (`material_ui` Package Compatibility):** `apps/mobile-app/pubspec.yaml` imports `material_ui: ^1.11.1` (and `main.dart` uses it instead of `package:flutter/material.dart`). Week 1 Day 1 smoke tests must confirm that `flutter_map`, `go_router`, and `flutter_localizations` (RTL Arabic) render without theme/widget type conflicts.

## Critical User Journeys (CUJs)

### CUJ 1: Rider Searches and Plans a Multi-Transfer Journey
* **Given:** A rider (aged 20–30) opens NQLa in Alexandria with GPS enabled (or a manually picked origin) and wants to reach a destination (typed in Egyptian Arabic, Franco-Arabic, or English).
* **When:** The rider enters their destination (e.g., `محطة مصر` or `ma7atet masr`) and selects a suggested landmark.
* **Then:** The app displays matching route options showing each leg ("Board Line A at [Landmark/Road Side] -> Alight at [Landmark B] -> Walk 5 min -> Board Line C -> Destination"), the upfront official EGP fare per leg and total, and the drawn route polylines and transfer walking segments on OpenStreetMap.

### CUJ 2: Rider Views Live Approaching Microbuses
* **Given:** The rider has selected a route leg and is waiting near the recommended boarding corridor.
* **When:** Active drivers on that line stream GPS positions (simulated in Increment I; WebSocket in Increment II+).
* **Then:** The map displays directional microbus markers matching that route with estimated arrival distance/time and a freshness indicator (dimming stale markers if updates pause >15 seconds).

### CUJ 3: Rider Boards and Pays via Cabin QR or 4-Digit Code
* **Given:** A rider with sufficient wallet balance steps onto a microbus that displays a printed QR sticker and 4-digit vehicle code in both front and back rows.
* **When:** The rider taps "Pay Ride", scans the QR code (or types the 4-digit vehicle code), confirms the displayed official fare and seat count (1..N), and submits.
* **Then:** An idempotent transfer debits the rider's wallet and credits the driver's wallet; the rider receives a high-contrast "Active Paid Receipt" screen (showing vehicle code, amount, seats, and timestamp), and the driver's phone speaks an Egyptian Arabic TTS confirmation (`"اتدفع 7 جنيه — أحمد"`).

### CUJ 4: Driver Runs Shift Hands-Free with Audio Alerts
* **Given:** A driver (aged 20–40) mounts their Android phone on the dashboard and switches into Driver Mode (`On Shift`), selecting their active route (and optional short-turn terminal).
* **When:** The driver drives along the corridor while background/foreground GPS broadcasts their position.
* **Then:** The screen shows only oversized, high-contrast status controls (`On Shift / Offline`, `Full / Not Stopping`, active passenger payment ticker); when approaching waiting NQLa riders ahead or receiving a QR/code payment, the phone speaks an Egyptian Arabic TTS alert without requiring the driver to touch or read the screen.

### CUJ 5: Spotty Network / Insufficient Balance Fallback
* **Given:** A rider tries to pay digitally inside a moving microbus where 3G/4G drops or wallet balance is lower than the official fare.
* **When:** The transfer cannot reach confirmation or fails balance validation.
* **Then:** The app never falsely marks the ride as paid—it displays a clear fallback prompt showing the exact official EGP fare (`"ادفع 7 جنيه كاش للسواق"`) and preserves idempotency keys so cellular retries never double-charge the rider.

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### 1. Platform & App Packaging (`apps/mobile-app`)

* **Platform Choice:** Flutter targeting mid-range Android devices (primary) and iOS from a single Dart codebase (`apps/mobile-app`, package `mobile_app`). GPS foreground services, camera QR scanning, local tile caching, and offline wallet state require native device APIs that a web app cannot maintain reliably while a driver's screen is locked.
* **Dual-Role Module Separation:** The graduation prototype runs as one app binary with a `demo` role switcher so presenters can demonstrate both Rider and Driver on one phone. Inside `lib/`, Rider and Driver code live in isolated feature directories (`features/rider/` and `features/driver/`) with zero cross-imports, route-scoped `Provider` instances, and `go_router` role guards (`/rider/*`, `/driver/*`). When moving toward Google Play Store release, the same codebase splits into two Android build flavors (`com.nqla.rider` and `com.nqla.driver`) so only the Driver manifest requests `ACCESS_BACKGROUND_LOCATION` and `FOREGROUND_SERVICE_LOCATION`.

### 2. System Boundary & Track Integration Architecture

Track 1 Mobile App connects strictly to **Track 2 (`backend/`, FastAPI + PostGIS + WebSockets)** as its single API gateway. Track 1 never calls Track 3 (ML/Simulation) or Track 4 (Arabic NLP/AI Agent) directly, and never performs client-side multi-transfer graph routing or safety scoring.

```text
+-----------------------------------------------------------------------------+
|                        apps/mobile-app (Track 1)                            |
|                                                                             |
|  [Rider UI: /rider/*]                     [Driver UI: /driver/*]            |
|   - Map & Bilingual Search                 - Shift & Route Selector         |
|   - Multi-Transfer Planner                 - Hands-Free Driving Dashboard   |
|   - QR / 4-Digit Pay & Receipt             - Arabic TTS (Pay + Proximity)   |
|   - Feedback & AI Chat (Inc II-IV)         - Heatmap & Alerts (Inc III+)    |
|            \                                       /                        |
|             v                                     v                         |
|      +---------------------------------------------------+                  |
|      |        Route-Scoped Providers (State)             |                  |
|      +---------------------------------------------------+                  |
|             |                  |                  |                         |
|             v                  v                  v                         |
|   [RouteRepository]  [TrackingRepository]  [WalletRepository]               |
|    (Abstract Iface)    (Abstract Iface)     (Abstract Iface)                |
|      /         \          /         \          /         \                  |
|  [Inc I]    [Inc II+]  [Inc I]    [Inc II+] [Inc I]    [Inc II+]            |
|  Local      Dio REST   Simulated  WebSocket Local      Dio REST +           |
|  Alexandria Fixtures   Polyline   Stream    Ledger     Idempotent           |
|  JSON                  Interpol.  + GPS FG  (Prefs)    Backend API          |
+-----------------------------------------------------------------------------+
                                      |
                    HTTPS / REST + WSS (v1 JSON Contracts)
                                      v
+-----------------------------------------------------------------------------+
|                  Track 2 Gateway: FastAPI + PostGIS + Redis                 |
|  - Route/Transfer Graph (BR-02)    - Live GPS Ingestion & Fan-out (BR-01)   |
|  - Wallet & QR Check-in Ledger     - Proxy to Track 3 (ML) & Track 4 (AI)   |
+-----------------------------------------------------------------------------+
```

### 3. Core Screen Flows & Navigation Map (`go_router`)

```text
/role-select (Increment I Demo Switcher; replaced by /auth in Inc II)
  |
  +---> /rider/map  (Shell: BaseOsmMap + Bilingual Search Bar + Live Microbus Pins)
  |       |--> /rider/routes       (Multi-transfer legs, walk connectors, official EGP fare)
  |       |--> /rider/pay          (QR Camera Scanner + 4-Digit Vehicle Code Keypad)
  |       |--> /rider/receipt/:txId (High-contrast Active Paid Receipt card)
  |       |--> /rider/wallet       (Balance, transaction history, Demo Top-Up)
  |       |--> /rider/feedback     (Increment II: Arabic/Franco trip rating)
  |       +--> /rider/agent        (Increment IV: Transportation AI Agent chat)
  |
  +---> /driver/setup (Select active Alexandria route + optional short-turn terminal)
          +--> /driver/shift (High-contrast Driving Dashboard)
                 |-- Oversized toggles: [On Shift / Off] & [Full / Accepting]
                 |-- Live payment ticker + Arabic TTS queue (receipts & waiting-rider alerts)
                 |-- /driver/wallet   (Daily simulated earnings ledger)
                 +-- /driver/heatmap  (Increment III: Demand heatmap & incentive alerts)
```

### 4. Composable Map Architecture (`flutter_map`)

All map screens reuse a single shared `BaseOsmMap` widget accepting modular overlay layers so future features plug in without modifying Increment I map code:
* `TileLayer` configured with `userAgentPackageName: 'com.nqla.mobile_app'` and local Alexandria bounding-box disk caching (`flutter_map_cache`, zoom 11–16) to avoid `tile.openstreetmap.org` rate limits and survive cellular drops.
* `RoutePolylineLayer`: renders solid polylines for microbus legs and dashed polylines for walking transfer segments, with distinct start/transfer/end landmark pins.
* `LiveVehiclesLayer`: driven by a `ValueNotifier<List<VehiclePosition>>` so marker ticks do not rebuild the underlying map tiles. Displays directional arrows, line code badges, and staleness states (normal `<15s`, dimmed `15–60s`, hidden `>60s`).
* `DemandHeatmapLayer` (Increment III): polygon/grid overlay enabled only inside `/driver/*`.

### 5. Data Model & Frozen v1 API Contracts (`docs/api_contracts/`)

All coordinate payloads use explicit `{ "lat": double, "lng": double }` objects (never positional `[lng, lat]` arrays) to prevent latitude/longitude swap bugs against PostGIS. All contracts carry `schema_version` and UTC ISO-8601 timestamps.

| Contract / Entity | Key Fields | Notes |
| :--- | :--- | :--- |
| **`RouteCorridor`** | `id`, `code`, `name_ar`, `name_en`, `official_fare_egp`, `polyline[]`, `stops[]` | Stops include `landmark_ar`, `landmark_en`, `aliases[]` (Franco/slang), `road_side` |
| **`JourneyPlanRequest`** | `origin {lat, lng}`, `destination_query`, `normalized_query`, `timestamp_utc` | Normalization runs client-side before lookup |
| **`JourneyPlan`** | `plan_id`, `total_fare_egp`, `total_duration_min`, `legs[]` | Each leg: `type` (`ride` \| `walk`), `route_id?`, `fare_egp`, `from_landmark`, `to_landmark`, `alighting_phrase_ar`, `path[]` |
| **`VehicleLocationUpdate`** | `vehicle_id`, `vehicle_code` (4-digit), `route_id`, `short_turn_stop_id?`, `lat`, `lng`, `heading_deg`, `seats_available`, `sequence_id`, `timestamp_utc`, `data_source` (`simulated` \| `live`) | Streamed over WebSocket (or `Stream.periodic` polyline interpolation in Inc I) |
| **`WalletTransferRequest`** | `idempotency_key` (UUIDv4), `rider_id`, `vehicle_code` (4-digit or scanned QR token), `route_id`, `seat_count`, `amount_egp`, `client_timestamp_utc` | Never marks paid offline; retries reuse identical `idempotency_key` |
| **`WalletTransferReceipt`** | `tx_id`, `status` (`pending` \| `confirmed` \| `failed`), `amount_egp`, `seat_count`, `vehicle_code`, `rider_display_name`, `server_timestamp_utc`, `failure_reason?` | Drives Rider receipt screen and Driver Arabic TTS queue |
| **`NearbyRiderAlert`** | `alert_id`, `zone_landmark_ar`, `waiting_count`, `distance_m`, `route_id`, `timestamp_utc` | Throttled server-side/simulator-side; triggers Driver TTS only when `On Shift` and not `Full` |

### 6. Bilingual Search, Audio TTS & Field Reliability Mechanics

* **Egyptian Arabic & Franco-Arabic Search Normalization:** Before matching stop aliases or calling Track 2 search, a shared `ArabicNormalizer` maps `أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`, strips diacritics, normalizes Franco-Arabic numerals (`2 -> أ`, `3 -> ع`, `5 -> خ`, `7 -> ح`, `9 -> ص` / phonetic tokens), and converts Eastern Arabic digits (`٠-٩`) to ASCII (`0-9`) for 4-digit vehicle codes and wallet amounts.
* **Hands-Free Driver Audio Queue (`flutter_tts` + Audio Focus):** Payment confirmations (`"اتدفع 7 جنيه — أحمد"`) and proximity alerts (`"في راكب قدامك عند سيدي جابر على بعد 200 متر"`) enter a sequential FIFO speech queue using Android navigation/notification audio focus (`AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`). A cooldown timer (45 seconds per zone, disabled when `Full / Not Stopping` is active) prevents repeated audio alerts at busy hubs. Every spoken event also appends to the visible high-contrast ticker in case device volume is muted.
* **Adaptive GPS & Battery Conservation (Driver Mode):** GPS runs inside an Android Foreground Service (`FOREGROUND_SERVICE_LOCATION`) strictly while `On Shift` is active, sampling every `15–25m` / `5s` while moving and backing off to `60s` heartbeats while stationary at a terminal. When offline, GPS frames buffer in local storage with monotonic timestamps and flush on reconnect.

### 7. Tech Stack Selection

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| **UI Framework** | Flutter (`^3.47` / Dart `^3.14`) | Already initialized in `apps/mobile-app`; native Android background GPS, camera QR, and TTS support |
| **Maps** | `flutter_map` + `latlong2` + tile cache | Already in `pubspec.yaml`; zero licensing cost (`BR-08`) using OpenStreetMap data |
| **Navigation** | `go_router` | Already in `pubspec.yaml`; declarative role-based route partitioning (`/rider/*`, `/driver/*`) |
| **State Management** | `provider` | Already in `pubspec.yaml`; lightweight route-scoped `ChangeNotifier` lifecycle |
| **Networking** | `dio` + `web_socket_channel` | `dio` already in `pubspec.yaml` for REST/interceptors; `web_socket_channel` added for Increment II live streams |
| **Local Storage** | `shared_preferences` (Inc I) -> `sqflite` (Inc II+) | Fast local persistence for Increment I simulated wallet ledger; SQLite added in Inc II for offline GPS queue and versioned route caches |
| **QR & Audio** | `mobile_scanner` + `flutter_tts` | Zero-hardware QR scan (with 4-digit manual keypad fallback) and offline-capable Egyptian Arabic voice alerts |
| **Localization** | `flutter_localizations` + `intl` | Built-in Flutter RTL (`ar_EG`) and English (`en`) support |

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative A: Pure GPS Proximity Payment Matching
* **Pros:** Zero printed stickers inside microbuses; one-tap payment from the rider's map view.
* **Cons:** GPS drift of 15–50m at busy Alexandria hubs (Mahatet Masr, Sidi Gaber, Victoria) causes payments to credit the wrong driver when multiple microbuses queue together.
* **Reason for Rejection:** Rejected because misattributed payments trigger immediate disputes between riders and drivers. Replaced by cabin QR stickers (front and back rows) paired with a printed 4-digit vehicle short code.

### Alternative B: Generic Push Notification Chime for Driver Receipts
* **Pros:** Uses standard OS notification sounds without integrating `flutter_tts` or audio-focus handling.
* **Cons:** Drivers in noisy traffic cannot tell who paid, for how many seats, or what amount without picking up and reading the phone.
* **Reason for Rejection:** Rejected due to driver distraction and payment ambiguity. Replaced by queued Egyptian Arabic TTS spoken confirmations (`"اتدفع 7 جنيه — أحمد"`) plus a visual fallback ticker when stopped.

### Alternative C: Driver Map-Pin Watching for Waiting Riders
* **Pros:** Avoids building proximity-trigger logic and speech queueing.
* **Cons:** Requires a moving driver to scan small pedestrian markers on a phone screen in dense traffic.
* **Reason for Rejection:** Rejected by author and design review because visual map scanning while driving creates road distraction. Replaced by throttled Egyptian Arabic TTS proximity alerts (`"في راكب قدامك..."`).

### Alternative D: Live Card Payment Gateway & Fawry Cash-Out in Release 1.0
* **Pros:** Demonstrates real money movement end-to-end.
* **Cons:** Storing user funds and settling driver cash-outs falls under Central Bank of Egypt (CBE) e-money and KYC/AML regulations, adds gateway fee drag on 5–10 EGP fares, and cannot ship in a 2-week sprint.
* **Reason for Rejection:** Rejected for graduation scope. Replaced by upfront official fare display plus a simulated closed-loop `Test Credits` wallet behind a swappable `WalletRepository` interface.

### Alternative E: Separate Rider and Driver Android Build Flavors on Day 1
* **Pros:** Cleanly isolates `ACCESS_BACKGROUND_LOCATION` into the Driver APK for Google Play Store review from Sprint 1.
* **Cons:** Adds multi-flavor build/signing configuration overhead while demonstrating a single-phone prototype in 2 weeks.
* **Reason for Rejection:** Rejected by author for prototype phase (deferred to production readiness). Mitigated by enforcing strict module isolation between `features/rider/` and `features/driver/` so splitting flavors later requires no UI or business-logic rewrite.

### Alternative F: In-App Hand-Signal Tutorial Guide (>10 Signals)
* **Pros:** Helps riders flag non-app microbuses when only a small share of drivers run NQLa.
* **Cons:** Adds manual gesture curation and UI steps during initial build.
* **Reason for Rejection:** Rejected by author in favor of live driver/rider map visibility and driver audio proximity alerts. Cold-start visibility gaps for non-app microbuses remain documented as a known limitation to revisit during field testing.

### Alternative G: Waiting on Track 2 FastAPI/PostGIS/WebSockets Before Mobile Build
* **Pros:** Avoids writing mock repositories and local fixture JSON.
* **Cons:** `backend/`, `docs/api_contracts/`, and `docker-compose.yml` are currently empty; waiting blocks the 2-week Increment I demo completely.
* **Reason for Rejection:** Rejected to keep Track 1 unblocked. Replaced by frozen v1 JSON contracts in `docs/api_contracts/` and local simulated repositories.

### Alternative H: Direct `tile.openstreetmap.org` Streaming Without Caching
* **Pros:** Zero cache storage setup.
* **Cons:** Violates OpenStreetMap's Tile Usage Policy (risking HTTP 403/429 blocks mid-demo) and leaves maps blank in 3G dead zones.
* **Reason for Rejection:** Rejected due to demo reliability and policy risk. Replaced by configuring `userAgentPackageName` and caching Alexandria map tiles locally.

--------------------------------------------------------------------------------

## Non-Functional Requirements

* **Security & Privacy:**
  * Prototype wallet balances represent simulated `Test Credits` only; no credit card numbers, national IDs, or live banking credentials are collected or stored.
  * Every wallet transfer generates a client-side `idempotency_key` (`UUIDv4`) to prevent duplicate debits on network retries, and never transitions to `confirmed` without explicit repository confirmation.
  * When Auth lands in Increment II, JWT access/refresh tokens live in `flutter_secure_storage`, and Increment I `sandbox` local wallet state clears cleanly on first authenticated login.
* **Performance & Battery:**
  * `LiveVehiclesLayer` reads from a `ValueNotifier` so marker updates do not rebuild OSM `TileLayer` widgets.
  * Driver GPS runs inside an Android Foreground Service strictly while `On Shift` is active, using adaptive intervals (`15–25m` / `5s` moving, `60s` stationary) to preserve mid-range Android battery over long shifts.
  * Alexandria OSM tiles (zoom 11–16) cache locally on disk to keep pan/zoom responsive over spotty 3G/4G.
* **Observability & Error Handling:**
  * Every `Dio` request attaches an `X-Request-ID` header, and telemetry/log events tag `data_source: simulated | live`.
  * Map pins apply explicit staleness rules (`>15s` dimmed, `>60s` hidden) so disconnected drivers never appear active.
  * Driver TTS events log delivery status (`played` vs `muted_fallback`) and always mirror into the visible high-contrast shift ticker.
* **Rollout & Backward Compatibility:**
  * `AppEnv` (`--dart-define=USE_MOCKS=true|false`) switches between Increment I local repositories and Increment II+ Track 2 endpoints without code edits.
  * Local storage keys/tables include an explicit `schema_version` integer with safe reset-on-mismatch for non-authoritative route/tile caches.

--------------------------------------------------------------------------------

### Additional Resources

* Project overview, `BR-01`–`BR-08`, and 4-track roadmap: [README.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/README.md)
* Separate Web Admin Dashboard & Landing Page spec (out of scope here): [track1_admin_web_spec.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/docs/track1_admin_web_spec.md)
* Brainstorm synthesis & Goldfish critique log: [concepts_brief.md](file:///C:/Users/HP/.gemini/antigravity/brain/33289013-4238-4139-b00b-23bfee1cf57a/concepts_brief.md)
* Existing Flutter dependencies: [pubspec.yaml](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/apps/mobile-app/pubspec.yaml)

### Future Improvements

* **Production Play Store Split:** Enable `rider` (`com.nqla.rider`) and `driver` (`com.nqla.driver`) Android build flavors so only the Driver app declares background location permissions.
* **Licensed PSP & Fawry Cash-Out:** Implement a CBE-licensed payment gateway adapter (`Paymob` / `Fawry Business` / `Meeza`) behind `WalletRepository` post-graduation.
* **Self-Hosted Alexandria PMTiles:** Serve Alexandria vector tiles from object storage/CDN (Protomaps PMTiles) for zero-ban, offline-first tile loading.
* **Crowdsourced Rider Telemetry:** Allow boarded riders using active route tracking to contribute anonymized corridor speed pings to fill gaps when drivers are offline.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Implementation is staged across **Increment I (2-Week Demo)** as the immediate build target, while locking the contracts, directory boundaries, and extension points required for **Increments II–IV (Months 2–5+)**.

### Milestone & Sprint Breakdown

| Phase | Timeline | Deliverables |
| :--- | :--- | :--- |
| **Phase 0: Baseline, Contracts & Permissions** | Days 1–2 | Freeze v1 JSON schemas in `docs/api_contracts/`; fix `widget_test.dart`; add Android/iOS permissions; configure `pubspec.yaml` dependencies and local Alexandria fixture JSON; verify `material_ui` + `flutter_map` + RTL compatibility. |
| **Phase 1: Core Shell, Theme, L10n & Map** | Days 3–6 | Implement `AppEnv`, `ArabicNormalizer`, RTL theme (`ar_EG`/`en`), `go_router` role guards, `BaseOsmMap` with tile caching, and `LocalFixtureRouteRepository` with 4–6 Alexandria corridors and bilingual stop/multi-transfer search UI. |
| **Phase 2: Simulated Wallet, QR/4-Digit Code & TTS** | Days 7–10 | Implement `LocalWalletRepository` (`SharedPreferences` + `idempotency_key`), Rider QR scanner + 4-digit keypad, "Active Paid Receipt" screen, in-app Demo Top-Up action, and `DriverAudioService` (`flutter_tts` Egyptian Arabic payment announcements). |
| **Phase 3: Simulated Live GPS, Driver Shift & Demo QA** | Days 11–14 | Implement `SimulatedTrackingRepository` (`Stream.periodic` polyline interpolation + `ValueNotifier` pins + staleness states), Driver `SelectRoute` & `DriverShift` dashboard with throttled proximity TTS alerts (`250m` radius, `45s` cooldown), and end-to-end CUJ 1–5 verification on a physical Android device. |
| **Phase 4: Live Backend & Auth (Increment II)** | Months 2–3 | Plug in `Dio` + `WebSocket` repositories against Track 2 FastAPI/PostGIS, add `features/auth/` (`flutter_secure_storage` JWT + sandbox wallet wipe), Android Foreground GPS Service (`geolocator` + `flutter_foreground_task` + `sqflite` offline queue), and `features/rider/feedback/` (Egyptian/Franco-Arabic ratings). |
| **Phase 5: Heatmaps, Safety & AI Agent (Increments III–IV)** | Months 3–5+ | Enable `DemandHeatmapLayer` and incentive alerts inside `features/driver/`, driver safety score cards, `features/rider/agent/` chat UI proxied through Track 2, and optional `rider`/`driver` Android build flavors for Play Store release. |

### Target Files to Create, Modify, or Delete

#### A. Contracts, Documentation & Fixtures
1. **`docs/api_contracts/v1_mobile_contracts.md`** *(Create)*
   * **Type / Scope:** Cross-Track JSON Schema Specification
   * **Proposed Changes:** Freeze v1 request/response and WebSocket payload schemas (`RouteCorridor`, `JourneyPlanRequest`, `JourneyPlan`, `VehicleLocationUpdate`, `WalletTransferRequest`, `WalletTransferReceipt`, `NearbyRiderAlert`) using explicit `{lat, lng}` objects, `schema_version`, `timestamp_utc`, `idempotency_key`, and `data_source` (`simulated | live`) so Track 1 mocks and Track 2 FastAPI match exactly.
2. **`docs/traceability/track1_mobile_matrix.md`** *(Create)*
   * **Type / Scope:** Academic Traceability Document
   * **Proposed Changes:** Map `BR-01`–`BR-08` and Increment I–IV user/functional requirements (`UR` -> `FR`) to `apps/mobile-app` feature modules for the thesis report.
3. **`apps/mobile-app/assets/fixtures/alexandria_corridors.json`** *(Create)*
   * **Type / Scope:** Bundled Local Dataset
   * **Proposed Changes:** Seed 4–6 real Alexandria corridors (for example, Corniche/Mandara–Mansheya, Abu Qir/Victoria–Mahatet Masr, El-Mahmoudia, Agami–Mansheya) with polyline coordinates, official EGP fares, transfer walking connectors, and Arabic/Franco-Arabic stop aliases.

#### B. App Configuration, Permissions & Localization
4. **`apps/mobile-app/pubspec.yaml`** *(Modify)*
   * **Type / Scope:** Package & Asset Configuration
   * **Proposed Changes:** Retain `flutter_map`, `latlong2`, `go_router`, `provider`, `dio`, `material_ui`, `cupertino_icons`; add `shared_preferences`, `uuid`, `mobile_scanner`, `flutter_tts`, `flutter_map_cache`, `web_socket_channel` (Inc II ready), `intl`, and `flutter_localizations` (SDK); uncomment `assets:` to bundle `assets/fixtures/alexandria_corridors.json`.
5. **`apps/mobile-app/l10n.yaml` & `apps/mobile-app/lib/core/l10n/app_ar.arb`, `app_en.arb`** *(Create)*
   * **Type / Scope:** Localization & RTL Setup
   * **Proposed Changes:** Define Egyptian Arabic (`ar`) and English (`en`) UI string tables for Rider and Driver screens, including cash-fallback and spoken TTS prompt templates.
6. **`apps/mobile-app/android/app/src/main/AndroidManifest.xml`** *(Modify)*
   * **Type / Scope:** Android Permissions & Branding
   * **Proposed Changes:** Add `INTERNET` (critical for release APKs), `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA` (QR scan), and `POST_NOTIFICATIONS`; update `android:label` to `NQLa`; document `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_LOCATION` entries for Increment II Driver GPS service.
7. **`apps/mobile-app/ios/Runner/Info.plist`** *(Modify)*
   * **Type / Scope:** iOS Permissions & Branding
   * **Proposed Changes:** Update `CFBundleDisplayName` to `NQLa` and add `NSLocationWhenInUseUsageDescription` and `NSCameraUsageDescription` strings.

#### C. Core Infrastructure (`apps/mobile-app/lib/core/` & `shared/`)
8. **`apps/mobile-app/lib/core/config/app_env.dart`** *(Create)*
   * **Type / Scope:** Environment Configuration
   * **Proposed Changes:** Read `--dart-define` flags (`USE_MOCKS` defaulting `true` in Inc I, `API_BASE_URL`, `WS_URL`, `SCHEMA_VERSION`) to control repository bindings without code edits.
9. **`apps/mobile-app/lib/core/constants/app_constants.dart`** *(Create; replaces `core/constants/.gitkeep`)*
   * **Type / Scope:** Constants
   * **Proposed Changes:** Define Alexandria default map center/bounds, tile cache zoom bounds (11–16), `userAgentPackageName` (`com.nqla.mobile_app`), vehicle staleness thresholds (`15s` dim, `60s` hide), and proximity TTS radius/cooldown (`250m`, `45s`).
10. **`apps/mobile-app/lib/core/theme/app_theme.dart`** *(Create; replaces `core/theme/.gitkeep`)*
    * **Type / Scope:** Theme & RTL Styling
    * **Proposed Changes:** Define Rider theme and high-contrast Driving Dashboard theme (oversized touch targets and legible contrast under daylight glare).
11. **`apps/mobile-app/lib/core/utils/arabic_normalizer.dart`** *(Create)*
    * **Type / Scope:** Text & Numeral Normalization Utility
    * **Proposed Changes:** Implement Arabic letter normalization (`أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`, diacritic removal), Franco-Arabic numeral phonetic alias expansion (`2/3/5/7/9`), and Eastern Arabic digit conversion (`٠-٩ -> 0-9`).
12. **`apps/mobile-app/lib/core/network/dio_client.dart` & `ws_client.dart`** *(Create)*
    * **Type / Scope:** Network Clients (Inc II Integration Ready)
    * **Proposed Changes:** Configure `Dio` with base URL, timeouts, `X-Request-ID` header interceptor, and structured error mapping; scaffold `WsClient` interface with heartbeat/backoff hooks for Track 2 WebSockets.
13. **`apps/mobile-app/lib/core/audio/driver_tts_service.dart`** *(Create)*
    * **Type / Scope:** Speech & Audio Focus Service
    * **Proposed Changes:** Wrap `flutter_tts` (`ar-EG` locale) with a FIFO announcement queue, audio-focus ducking, mute/failure outcome logging, and callback hooks to update the visible Driver shift ticker.
14. **`apps/mobile-app/lib/shared/models/`** *(Create: `geo_point.dart`, `route_corridor.dart`, `journey_plan.dart`, `vehicle_location.dart`, `wallet_models.dart`, `nearby_rider_alert.dart`, `user_role.dart`)*
    * **Type / Scope:** Immutable Domain Models & JSON Mappers
    * **Proposed Changes:** Model all v1 contract entities with explicit `{lat, lng}` parsing and `schema_version` / `data_source` fields.
15. **`apps/mobile-app/lib/shared/repositories/`** *(Create: `route_repository.dart`, `tracking_repository.dart`, `wallet_repository.dart` + `mock_*.dart` implementations)*
    * **Type / Scope:** Abstract Repository Contracts & Increment I Simulators
    * **Proposed Changes:** Define repository interfaces and Increment I local implementations: `LocalFixtureRouteRepository` (loads bundled JSON + computes direct/1-transfer plans), `SimulatedTrackingRepository` (interpolates vehicle `GeoPoint`s along corridor polylines and emits `NearbyRiderAlert`s), and `LocalWalletRepository` (`SharedPreferences`-backed atomic test-credit ledger enforcing `idempotency_key`, vehicle-code lookup, and shared Rider/Driver demo balances).
16. **`apps/mobile-app/lib/shared/widgets/base_osm_map.dart` & `map_layers.dart`** *(Create; replaces `shared/widgets/.gitkeep`)*
    * **Type / Scope:** Composable Map Component
    * **Proposed Changes:** Build `BaseOsmMap` wrapping `FlutterMap` + `flutter_map_cache`, modular `RoutePolylineLayer` (solid ride + dashed walk), `StopsMarkerLayer`, and `ValueNotifier`-driven `LiveVehiclesLayer` with directional markers and staleness styling.

#### D. Feature Modules, Routing & Entrypoint
17. **Empty Scaffold Cleanup (`apps/mobile-app/lib/features/{map,ride,feedback,agent}/screens/.gitkeep` & `core/router/.gitkeep`)** *(Delete / Reorganize)*
    * **Type / Scope:** Directory Hygiene
    * **Proposed Changes:** Remove placeholder `.gitkeep` files inside unused top-level `map/`, `ride/`, `feedback/`, and `agent/` folders so all Rider modules live strictly under `features/rider/` and all Driver modules live under `features/driver/` with zero cross-imports.
18. **`apps/mobile-app/lib/features/auth/screens/role_select_screen.dart` & `session_provider.dart`** *(Create; replaces `features/auth/screens/.gitkeep`)*
    * **Type / Scope:** Demo Role Switcher & Session State
    * **Proposed Changes:** Provide `SessionProvider` (`role: rider | driver`, demo `userId`) and a 2-button Demo Role Picker (`/role-select`) for Increment I, structured so Increment II login replaces the picker without changing downstream routes.
19. **`apps/mobile-app/lib/features/rider/`** *(Create: `providers/rider_map_provider.dart`, `providers/rider_wallet_provider.dart`, `screens/rider_map_screen.dart`, `screens/route_results_screen.dart`, `screens/qr_pay_sheet.dart`, `screens/active_receipt_screen.dart`, `screens/rider_wallet_screen.dart`)*
    * **Type / Scope:** Rider Feature Slice
    * **Proposed Changes:** Implement bilingual search bar + `BaseOsmMap` + live microbus overlay, multi-transfer leg cards with landmark alighting phrases and official EGP fares, QR camera scanner (`mobile_scanner`) + 4-digit vehicle code keypad, high-contrast "Active Paid Receipt" screen, offline/low-balance cash fallback banner, and Rider wallet screen with "Add Demo Balance" control.
20. **`apps/mobile-app/lib/features/driver/`** *(Create: `providers/driver_shift_provider.dart`, `screens/driver_setup_screen.dart`, `screens/driver_shift_screen.dart`, `screens/driver_wallet_screen.dart`; replaces `features/driver/screens/.gitkeep`)*
    * **Type / Scope:** Driver Feature Slice
    * **Proposed Changes:** Implement pre-drive route/short-turn selector, high-contrast driving dashboard (`On Shift / Off` and `Full / Accepting` oversized toggles, live payment ticker, Arabic TTS integration for both payment receipts and throttled waiting-rider proximity alerts, plus a demo trigger to preview simulated boarding payments), and Driver simulated earnings ledger.
21. **`apps/mobile-app/lib/core/router/app_router.dart` & `apps/mobile-app/lib/main.dart`** *(Create / Modify)*
    * **Type / Scope:** Navigation & Composition Root
    * **Proposed Changes:** Wire `GoRouter` with `refreshListenable: sessionProvider` guarding `/rider/*` and `/driver/*` subtrees with route-scoped feature `Provider`s; update `main.dart` (`NQLaApp`) to initialize `AppEnv`, repositories (`USE_MOCKS`), localization (`ar`, `en`), `AppTheme`, and `MaterialApp.router`.

#### E. Automated Tests & Verification
22. **`apps/mobile-app/test/widget_test.dart`** *(Modify)*
    * **Type / Scope:** Smoke & Widget Test
    * **Proposed Changes:** Fix broken `MyApp` reference to instantiate `NQLaApp` with test dependencies, verify role selection renders, and verify `BaseOsmMap` + RTL `TextField` compatibility under `material_ui`.
23. **`apps/mobile-app/test/arabic_normalizer_test.dart`, `local_route_repository_test.dart`, `local_wallet_repository_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests
    * **Proposed Changes:** Verify Egyptian Arabic / Franco-Arabic / Eastern-digit normalization, direct and 1-transfer Alexandria route resolution, atomic wallet balance transfer, `idempotency_key` deduplication, insufficient-balance error handling, and vehicle-code lookup.

### Verification Plan

* **Static Analysis & Linting:** Run `flutter analyze` inside `apps/mobile-app` — must exit `0` with zero errors or warnings.
* **Unit & Widget Tests:** Run `flutter test` inside `apps/mobile-app` — all unit tests (`arabic_normalizer_test`, `local_route_repository_test`, `local_wallet_repository_test`) and widget smoke tests must pass.
* **Release Build Verification:** Run `flutter build apk --release` (or `--debug` + `--profile` followed by release verification) to confirm `AndroidManifest.xml` permissions and Gradle config build cleanly.
* **Manual End-to-End Demo Walkthrough (CUJs 1–5 on Physical Android Device):**
  1. Search destination in both Arabic (`محطة مصر`) and Franco-Arabic (`ma7atet masr`), confirm multi-transfer leg cards, walk connector, and official EGP fare render on OpenStreetMap.
  2. Observe simulated microbuses moving along the corridor and verify stale-pin handling when simulation pauses >15s.
  3. Switch to Rider pay sheet, test both QR scan and 4-digit code entry (`٠١٢٣` normalized), confirm Rider balance decrements, "Active Paid Receipt" displays, and Driver `DriverTtsService` speaks the Arabic confirmation.
  4. Verify insufficient-balance and simulated-offline states display the exact cash fallback fare (`"ادفع X جنيه كاش"`) without mutating balances.
  5. Switch to Driver Mode, toggle `On Shift`, trigger a simulated waiting-rider proximity event, verify throttled Arabic TTS plays once per 45s cooldown and stops when `Full / Not Stopping` is toggled.

--------------------------------------------------------------------------------

*Drafted with EGM*

