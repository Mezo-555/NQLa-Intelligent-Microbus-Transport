# NQLa Track 1 Mobile App — Design & Architecture Specification

* **Author:** YakootShaker
* **Status:** Proposed
* **Date:** 2026-11-26

--------------------------------------------------------------------------------

## Overview

NQLa (نقلة) is a Flutter mobile application (`apps/mobile-app`, Dart package `mobile_app`) for two user groups in Alexandria, Egypt: **riders** (aged 20–30, daily commuters and university students on Android smartphones) and **informal microbus drivers** (aged 20–40, using mounted personal Android smartphones).

Unlike previous minibus services such as Swvl—which chartered vehicles, subsidized fares, and required scheduled seat bookings—NQLa owns no vehicles, pays no fare subsidies, and organizes the informal microbus lines already operating in Alexandria. Within Track 1, `apps/mobile-app` (referred to as "Passenger App" and "Driver App" in [README.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/README.md#L29)) covers the Rider and Driver mobile interfaces only; `apps/admin-dashboard` and `apps/website` (`nq8la.tech`) are separate Track 1 web applications, while backend, machine learning, and NLP services (`backend/`, `ai_services/`) belong to Tracks 2, 3, and 4.

| Dimension | Scheduled Minibus Model (e.g., Swvl) | NQLa Mobile App (This Design) |
| :--- | :--- | :--- |
| **Fleet Ownership** | Chartered buses requiring seat utilization targets | Zero vehicles owned; organizes independent microbus drivers |
| **Pricing & Subsidies** | Subsidized fares competing with ride-hailing | Zero subsidies; displays official route tariffs upfront |
| **Boarding Model** | Pre-scheduled pickup slots with booking cancellations | Street-corridor visibility + hands-free audio proximity alerts |
| **Mapping & Routing Stack** | Commercial mapping and managed routing APIs | Open-source stack (`OpenStreetMap`, `PostGIS`, `FastAPI`) |

--------------------------------------------------------------------------------

## The Problem

Alexandria's microbus network operates without fixed timetables, digital route directories, or live visibility between waiting riders and moving drivers. Field interviews with riders and drivers surfaced five recurring daily failures:

1. **No Route or Transfer Visibility (Riders):** Microbuses have no fixed stops—riders stand along a street with no way to know whether any line on that road reaches their destination, or how to combine multiple lines with walking segments when no direct microbus exists.
2. **Undocumented Hand-Signal Barrier (Riders):** More than 10 local destination hand signals exist by word of mouth. Riders who do not know the signal must flag down every passing microbus and ask the driver verbally.
3. **Unknown Wait Times (Riders):** Standing on a road offers no visibility into whether a microbus on the needed line is nearby or absent.
4. **Fare Disputes and Missing Change (Riders & Drivers):** Without an objective tariff reference, fare disagreements arise between riders and drivers, and 1–2 EGP coin-change shortages frequently cause disputes when exact change is unavailable.
5. **Cash Handling Distraction (Drivers):** Drivers collect fares and count small change across up to 14 passengers while driving manual vehicles in dense traffic.

### Proposed Solution

NQLa addresses these problems through three mobile capabilities backed by no in-vehicle hardware (`BR-08`, Business Requirement 8):

1. **Route Discovery & Multi-Transfer Planning:** Bilingual search (Egyptian Arabic, Franco-Arabic aliases, English) returning step-by-step journeys ("ride Line X to Landmark A, walk 5 minutes to Landmark B, ride Line Y to destination") with upfront official fares and inline windshield/stop cues.
2. **Live Microbus Visibility & Hands-Free Pickup Alerts:** Real-time microbus locations on an OpenStreetMap map for riders, paired with an optional rider waiting signal that triggers throttled Egyptian Arabic spoken (TTS) alerts to approaching drivers.
3. **Simulated Cashless Wallet with Cabin QR + 4-Digit Code:** Upfront fare calculation plus an in-app wallet transfer triggered by scanning a cabin QR sticker or entering a printed 4-digit vehicle code (placed in front and back rows), confirmed via spoken Egyptian Arabic TTS on the driver's phone so the driver does not read the screen while driving.

--------------------------------------------------------------------------------

## Goals

*(Terminology alignment with [README.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/README.md): `BR` = Business Requirement `BR-01`–`BR-08`, `UR` = User Requirement, `FR` = Functional Requirement, `Passenger` = Rider.)*

### Increment I Demo (2-Week Target)
* **Independent Track 1 Vertical Slice:** Deliver a runnable Flutter app on an Android phone demonstrating the three core UI loops against local simulated repositories (since `backend/` is currently empty):
  1. Interactive Alexandria OpenStreetMap view with bilingual stop/corridor search and single/multi-transfer route display.
  2. Simulated real-time microbus movement along Alexandria corridors with live map markers, rider wait-intent signaling, and driver proximity TTS simulation.
  3. Simulated rider-to-driver wallet balance transfer (`Test Credits`) via cabin QR / 4-digit code check-in with pre-debit route/fare confirmation and spoken Egyptian Arabic TTS receipt.
* **Provisional Contract Foundation:** Author provisional `v1-draft` JSON schemas in `docs/api_contracts/v1_mobile_contracts.md` for joint Track 2 ratification at Sprint Planning, isolating simulated data behind repository interfaces so Track 2 endpoints replace mocks in Increment II without UI rewrites.

### Increments II–IV (5+ Month Final Graduation Target)
* **Complete Rider & Driver Journeys:** Integrate authentication and role guards, live Track 2 PostGIS multi-transfer routing (`BR-02`), live WebSocket GPS tracking and ride matching (`BR-01`, `BR-08`), Egyptian/Franco-Arabic feedback submission (`BR-06`), driver safety score views (`BR-05`), driver demand heatmaps and incentive alerts (`BR-03`, `BR-04`), and the Transportation AI Agent chat UI.
* **Field Reliability:** Operate on Android `8.0+` (`>=2 GB RAM`) devices over intermittent Egyptian 3G/4G connections with built-in map tile caching, battery-bounded foreground GPS tracking, `>=48dp` driver tap targets, WCAG AA (`>=4.5:1`) contrast, and RTL Arabic support.
* **Traceability & Team Handoff:** Maintain architecture documentation, `v1-draft` schemas, and `BR -> UR -> FR` traceability in `docs/traceability/track1_mobile_matrix.md`.

--------------------------------------------------------------------------------

## Non-Goals

* **Web Applications (`apps/admin-dashboard`, `apps/website`):** Out of scope here; tracked separately in [track1_admin_web_spec.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/docs/track1_admin_web_spec.md).
* **Live Payment Gateway & Real Money Custody:** Integrating real bank cards, Central Bank of Egypt (CBE) e-money licensing, or live Fawry cash-out settlement is excluded from the graduation prototype. All wallet loads and transfers operate on simulated `Test Credits` until a licensed payment service provider (PSP) is integrated post-graduation.
* **Hand-Signal Tutorial UI (Increment I):** Teaching >10 local hand signals in a dedicated UI flow is excluded; route cards instead include a concise text `boarding_cue_ar` hint alongside live map visibility and driver audio proximity alerts.
* **Short-Turn Partial Tariffs (Increment I):** Mid-route short-turn terminals (`short_turn_stop_id`) and segmented sub-fares are deferred to Increment II+ when Track 2 route topology is live.
* **Production Play Store Packaging Split:** Splitting `rider` and `driver` into separate Google Play binaries/flavors for background-location policy review is deferred until production rollout, while keeping code modules decoupled now.
* **Dedicated Vehicle Hardware (`BR-08`):** No OBD-II trackers, NFC readers, or dash terminals; only printed QR/4-digit cabin stickers and smartphones are permitted.
* **Client-Side Routing, ML, or NLP Execution:** Track 1 mobile does not run graph routing, Franco-Arabic NLP transliteration, demand forecasting, safety scoring, or LLM tool-calling locally; Track 2 (`backend/`) serves as the single API gateway for Tracks 2, 3, and 4.
* **Operations Outside Alexandria:** Routes, stops, and map caches target Alexandria governorate only.

--------------------------------------------------------------------------------

## Open Questions

None — Increment I baseline questions (Alexandria demo fixture ownership and `material_ui` SDK usage) are resolved: Track 1 authors the 4 Increment I demo fixture corridors (`alexandria_corridors.json`) while Track 2 owns the canonical Alexandria PostGIS dataset per [README.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/README.md#L72), and `material_ui: ^1.11.1` is retained because Flutter `3.50.0` deprecates `package:flutter/material.dart` in favor of `package:material_ui/material_ui.dart`.

--------------------------------------------------------------------------------

## Critical User Journeys (CUJs)

### CUJ 1: Rider Searches and Plans a Multi-Transfer Journey
* **Given:** A rider (aged 20–30) opens NQLa in Alexandria with GPS enabled (or a chosen origin) and wants to reach a destination.
* **When:** The rider enters a destination in Arabic or Franco-Arabic (for example, `محطة مصر` or `ma7atet masr`) and selects a matching stop.
* **Then:** The app displays matching route options showing each leg ("Board Line C2 at [Landmark/Road Side] -> Alight at [Landmark B] -> Walk 5 min -> Board Line C1 -> Destination"), the inline `boarding_cue_ar` windshield cue, the upfront official EGP fare per leg and total, and the drawn route polylines and transfer walking segments on OpenStreetMap.

### CUJ 2: Rider Views Live Microbuses and Signals Waiting Intent
* **Given:** The rider has selected a route leg and is standing at or near the recommended boarding corridor.
* **When:** Active drivers on that line stream positions (simulated in Increment I; WebSocket in Increment II+), and the rider taps `"أنا مستني هنا / Waiting at Stop"` (GPS-confirmed within corridor proximity).
* **Then:** The map displays directional microbus markers matching that route with freshness styling (dimming stale markers after pause thresholds), while an ephemeral `RiderWaitSignal` (10-minute TTL) notifies approaching drivers on that line. The signal cancels automatically if the rider taps Cancel or completes boarding payment.

### CUJ 3: Rider Boards and Pays via Cabin QR or 4-Digit Code
* **Given:** A rider with sufficient `Test Credits` balance steps onto a microbus displaying a printed QR sticker and 4-digit vehicle code in both front and back rows.
* **When:** The rider taps `"Pay Ride"`, scans the QR (`nqla://pay?v=0123`) or types the 4-digit code (`0123` / `٠١٢٣`), selects seat count (`1..14`), reviews the pre-debit confirmation card showing the resolved vehicle code, route name, and official fare, and confirms.
* **Then:** An idempotent transfer debits the rider's wallet and credits the driver's wallet; the rider receives a `"Active Paid Receipt"` screen (vehicle code, route, amount, seats, timestamp), and `LocalWalletRepository` emits the receipt event so Driver Mode speaks the masked Egyptian Arabic TTS confirmation (`"اتدفع 7 جنيه — كود 0123"`). On a single demo phone while in Rider Mode, the receipt screen also includes a `"Preview Driver TTS"` button to demonstrate the audio alert directly.

### CUJ 4: Driver Runs Shift Hands-Free with Audio Alerts
* **Given:** A driver (aged 20–40) mounts their Android phone on the dashboard and switches into Driver Mode (`On Shift`), selecting their active Alexandria corridor.
* **When:** The driver drives along the corridor while location broadcasting is active.
* **Then:** The screen displays only large, high-contrast status controls (`On Shift / Off` and `Full / Not Stopping`, `>=48dp` targets, `>=4.5:1` contrast) and a live payment ticker; when approaching waiting NQLa riders ahead or receiving a boarding payment, the phone speaks a queued Egyptian Arabic TTS alert without requiring screen interaction (and mirrors every alert to the visible ticker).

### CUJ 5: Cellular Timeout / Insufficient Balance Fallback
* **Given:** A rider attempts a digital payment inside a moving microbus where cellular connectivity drops or wallet balance is lower than the official fare.
* **When:** The transfer fails balance validation or exceeds the 5-second synchronous confirmation timeout.
* **Then:** The app marks the attempt `voided_to_cash` (blocking automatic background retry of that `idempotency_key` to prevent double-charging), leaves wallet balances unchanged, and displays the exact official cash fare (`"ادفع 7 جنيه كاش للسواق"`).

--------------------------------------------------------------------------------

## Technical Plan (Architecture)

### 1. Platform & App Packaging (`apps/mobile-app`)

* **Platform Choice:** Flutter targeting Android (`8.0+`, `>=2 GB RAM`, primary) and iOS from a single Dart codebase (`apps/mobile-app`, package `mobile_app`). Camera QR scanning, local tile caching, TTS audio focus, and future foreground GPS services require native device APIs.
* **Dual-Role Module Separation:** The graduation prototype runs as one app binary with a demo role switcher so presenters can demonstrate Rider and Driver on one phone, storing cached wallet history locally. Inside `lib/`, Rider and Driver code live in isolated feature directories (`features/rider/` and `features/driver/`) with zero cross-imports, route-scoped state providers, and `go_router` role guards (`/rider/*`, `/driver/*`). Before Play Store release, the same codebase splits into `com.nqla.rider` and `com.nqla.driver` build flavors so only the Driver manifest requests background location permissions.

### 2. System Boundary & Track Integration Architecture

Track 1 Mobile App connects to **Track 2 (`backend/`, FastAPI + PostGIS + WebSockets)** as its single API gateway once live integration begins in Increment II. Track 1 never calls Track 3 or Track 4 directly, and never executes graph routing, NLP transliteration, or ML scoring on the client.

```text
+-----------------------------------------------------------------------------+
|                        apps/mobile-app (Track 1)                            |
|                                                                             |
|  [Rider UI: /rider/*]                     [Driver UI: /driver/*]            |
|   - Map, Search & Wait Signal              - Shift & Corridor Selector      |
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
|  Local      Track 2    Simulated  WebSocket Local      Track 2              |
|  Fixture    REST       Corridor   + GPS FG  Serialized Idempotent           |
|  Plans      Plans      Positions  Service   Ledger     API Ledger           |
+-----------------------------------------------------------------------------+
                                      |
              HTTPS / REST + WSS (Provisional v1-draft Contracts)
                                      v
+-----------------------------------------------------------------------------+
|                Track 2 Gateway: FastAPI + PostGIS + WebSockets              |
|  - Route/Transfer Graph (BR-02)    - Live GPS Ingestion & Fan-out (BR-01)   |
|  - Wallet & QR Check-in Ledger     - Proxy to Track 3 (ML) & Track 4 (AI)   |
+-----------------------------------------------------------------------------+
```

### 3. Core Screen Flows & Navigation Map (`go_router`)

* **Initial Location & Role Guards:** `GoRouter` starts at `/role-select` (Increment I demo switcher; replaced by `/auth` in Increment II). Navigating to `/rider/*` without `UserRole.rider` or `/driver/*` without `UserRole.driver` redirects back to `/role-select`. Leaving Driver Mode triggers explicit teardown (`DriverShiftProvider.dispose()`, stopping active tracking subscriptions and cancelling `DriverTtsService` speech).

```text
/role-select (Increment I Demo Switcher; replaced by /auth in Increment II)
  |
  +---> /rider/map        (RiderMapScreen: BaseOsmMap + Search + Waiting Toggle + Pins)
  |       |--> /rider/routes        (RouteResultsScreen: pre-authored legs, cue, fare)
  |       |--> /rider/pay           (QrPayScreen: QR Scanner + 4-Digit Keypad + Confirm)
  |       |--> /rider/receipt/:txId (ActiveReceiptScreen: paid receipt + TTS preview)
  |       |--> /rider/wallet        (RiderWalletScreen: balance, history, Add Demo Balance)
  |       |--> /rider/feedback      (Increment II placeholder / future route)
  |       +--> /rider/agent         (Increment IV placeholder / future route)
  |
  +---> /driver/setup     (DriverSetupScreen: select active Alexandria corridor)
          +--> /driver/shift (DriverShiftScreen: high-contrast driving dashboard)
                 |-- Toggles: [On Shift / Off] & [Full / Not Stopping]
                 |-- Live payment ticker + Arabic TTS queue (receipts & wait alerts)
                 |-- /driver/wallet   (DriverWalletScreen: daily simulated earnings)
                 +-- /driver/heatmap  (Increment III placeholder / future route)
```

### 4. Modular Map Architecture (`flutter_map`)

All map screens share a single `BaseOsmMap` widget accepting composable overlay layers:
* **Tile Provider:** Uses `flutter_map: ^8.3.2` `NetworkTileProvider` with `BuiltInMapCachingProvider` and `userAgentPackageName` configured from app constants (`com.nqla.mobile_app`) so tiles persist across intermittent cellular connectivity without violating OSM request attribution rules.
* **Overlay Layers:** `RoutePolylineLayer` (solid ride paths + dashed walking connectors), `StopsMarkerLayer` (boarding/transfer landmarks), `LiveVehiclesLayer` (decoupled from tile rebuilds, showing directional markers, line badges, and staleness dimming), and future `DemandHeatmapLayer` (Increment III Driver Mode only).

### 5. Provisional `v1-draft` Data Contracts (`docs/api_contracts/v1_mobile_contracts.md`)

Contracts in `docs/api_contracts/` are authored as `v1-draft` for Increment I mock conformance and ratified jointly with Track 2 at Increment II Sprint Planning. All coordinate payloads use explicit `{ "lat": double, "lng": double }` objects and UTC ISO-8601 timestamps.

| Entity | Core Purpose | Authority & Key Invariants |
| :--- | :--- | :--- |
| **`RouteCorridor`** | Alexandria microbus corridor definition | Includes `id`, `code`, `official_fare_egp`, `boarding_cue_ar`, polyline, and stops with `aliases[]` |
| **`JourneyPlanRequest`** | Origin coordinate + raw `destination_query` | Sends raw query string; Track 2/4 handles NLP transliteration in Increment II+ |
| **`JourneyPlan`** | Single or multi-transfer trip option | Ordered `ride` and `walk` legs with landmarks, `alighting_phrase_ar`, and upfront EGP fare |
| **`RiderWaitSignal`** | Ephemeral curbside waiting intent | `signal_id`, `route_id`, `{lat, lng}`, `ttl_sec`, `status` (`waiting` \| `boarded` \| `cancelled`) |
| **`VehicleLocationUpdate`** | Real-time microbus telemetry frame | `vehicle_code` (4-digit `String`), `route_id`, `{lat, lng}`, `heading_deg`, `data_source` (`simulated` \| `live` \| `rider_crowdsourced`) |
| **`WalletTransferRequest`** | Boarding payment submission | `idempotency_key` (`UUIDv4`), `vehicle_code`, `seat_count`, `expected_fare_egp?` (repository/server resolves `route_id` & official fare) |
| **`WalletTransferReceipt`** | Transfer outcome & TTS trigger payload | `tx_id`, `status` (`confirmed` \| `failed` \| `voided_to_cash`), `amount_egp`, `vehicle_code`, optional masked `rider_display_label` |
| **`WalletAccount` / `WalletTransaction`** | Rider & Driver ledger balances | Stores balance (`Test Credits`) and ordered credit/debit transaction entries |
| **`NearbyRiderAlert`** | Driver audio proximity notification | `alert_id`, `zone_landmark_ar`, `waiting_count`, `distance_m`, `route_id` |

### 6. Bilingual Input, Audio TTS & Field Reliability Mechanics

* **Search & Digit Normalization:** In Increment I, client-side `ArabicNormalizer` handles Arabic letter normalization (`أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`, diacritic removal) and Eastern Arabic digit conversion (`٠-٩ -> 0-9`) for 4-digit codes and wallet amounts; bilingual/Franco-Arabic queries match static stop `aliases[]` in fixture data, keeping full Franco-Arabic NLP pipelines in Track 4.
* **Hands-Free Driver Audio Queue (`flutter_tts`):** Payment receipts and waiting-rider alerts enter a sequential FIFO speech queue configured with `awaitSpeakCompletion(true)` and navigation audio-focus ducking, throttled per zone and silenced when `Full / Not Stopping` is enabled. Because mid-range Android devices may lack installed `ar-EG` TTS voice data or be muted, every alert always appends to the visible high-contrast shift ticker.
* **Increment II Foreground GPS Path:** Continuous background GPS via Android Foreground Service (`FOREGROUND_SERVICE_LOCATION`) and adaptive movement/stationary intervals are deferred to Increment II alongside Track 2 WebSocket ingestion.

### 7. Tech Stack Selection

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| **UI Framework** | Flutter / Dart (`sdk: ^3.14.0` in `pubspec.yaml`) | Initialized in `apps/mobile-app`; native camera QR, TTS, and future foreground GPS access |
| **UI Package** | `material_ui: ^1.11.1` | Already in `pubspec.yaml` and `main.dart`; required in current Flutter SDK (`package:flutter/material.dart` is deprecated) |
| **Maps & Caching** | `flutter_map: ^8.3.2` + `latlong2: ^0.10.1` | Already in `pubspec.yaml`; zero API cost (`BR-08`) with `BuiltInMapCachingProvider` |
| **Navigation** | `go_router: ^18.1.4` | Already in `pubspec.yaml`; declarative role-guarded subtrees (`/rider/*`, `/driver/*`) |
| **State Management** | `provider: ^6.1.5+1` | Already in `pubspec.yaml`; route-scoped `ChangeNotifier` lifecycle and teardown |
| **Networking (Inc II+)** | `dio: ^5.11.1` (present; WebSocket pkg deferred) | `dio` already in `pubspec.yaml`; REST/WebSocket clients wire in Increment II when `backend/` exists |
| **Local Storage** | `shared_preferences: ^2.5.6` (Inc I) -> `sqflite` (Inc II+) | Fast persisted demo ledger in Increment I; SQLite offline queue added in Increment II |
| **QR & Audio** | `mobile_scanner: ^7.5.0` + `flutter_tts: ^4.2.5` + `uuid: ^4.6.0` | Cabin QR scan + 4-digit keypad fallback, Egyptian Arabic speech, and `UUIDv4` idempotency keys |
| **Localization** | `flutter_localizations` + `intl: ^0.20.2` | Built-in Flutter RTL (`ar`) and English (`en`) support |

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative A: Pure GPS Proximity Payment Matching
* **Pros:** Zero printed stickers inside microbuses; one-tap payment from the rider's map view.
* **Cons:** GPS drift of 15–50m at busy Alexandria hubs (Mahatet Masr, Sidi Gaber, Victoria) causes payments to credit the wrong driver when multiple microbuses queue together.
* **Reason for Rejection:** Misattributed payments trigger fare disputes between riders and drivers. Replaced by cabin QR stickers (front and back rows) paired with a printed 4-digit vehicle short code and a pre-debit confirmation step.

### Alternative B: Generic Push Notification Chime for Driver Receipts
* **Pros:** Uses standard OS notification sounds without integrating `flutter_tts` or audio-focus handling.
* **Cons:** Drivers in noisy traffic cannot tell who paid, for how many seats, or what amount without picking up and reading the phone.
* **Reason for Rejection:** Increases driver visual distraction and payment ambiguity. Replaced by queued Egyptian Arabic TTS confirmations plus a visible shift ticker.

### Alternative C: Driver Map-Pin Watching for Waiting Riders
* **Pros:** Avoids building proximity-trigger logic and speech queueing.
* **Cons:** Requires a moving driver to scan small pedestrian markers on a phone screen in dense traffic.
* **Reason for Rejection:** Scanning individual pins while driving introduces road distraction. Replaced by throttled Egyptian Arabic TTS proximity alerts driven by explicit `RiderWaitSignal` intent.

### Alternative D: Live Card Payment Gateway & Fawry Cash-Out in Release 1.0
* **Pros:** Demonstrates real money movement end-to-end.
* **Cons:** Storing user funds and settling driver cash-outs falls under Central Bank of Egypt (CBE) e-money and KYC/AML regulations, adds gateway fee drag on 5–10 EGP fares, and cannot ship in a 2-week sprint.
* **Reason for Rejection:** Out of scope for the graduation timeline and CBE compliance boundaries. Replaced by upfront official fare display plus a simulated `Test Credits` wallet behind `WalletRepository`.

### Alternative E: Separate Rider and Driver Android Build Flavors on Day 1
* **Pros:** Isolates `ACCESS_BACKGROUND_LOCATION` into the Driver APK for Google Play Store review from Sprint 1.
* **Cons:** Adds multi-flavor build/signing setup overhead while demonstrating a single-phone prototype in 2 weeks.
* **Reason for Rejection:** Deferred until production rollout to prioritize the 2-week demo, while isolating `features/rider/` and `features/driver/` so flavor splitting later requires no rewrite.

### Alternative F: Dedicated In-App Hand-Signal Tutorial Screen (>10 Signals)
* **Pros:** Teaches informal gestures when non-app microbuses pass by.
* **Cons:** Adds gesture illustration curation and extra screens during Increment I.
* **Reason for Rejection:** Replaced in Increment I by live map visibility, driver audio proximity alerts, and a single inline `boarding_cue_ar` text hint on route cards.

### Alternative G: Waiting on Track 2 FastAPI/PostGIS/WebSockets Before Mobile Build
* **Pros:** Avoids writing local fixture JSON and simulated repositories.
* **Cons:** `backend/`, `docs/api_contracts/`, and `docker-compose.yml` are currently empty; waiting blocks the 2-week Increment I demo.
* **Reason for Rejection:** Unacceptable schedule block for Track 1. Replaced by provisional `v1-draft` contracts and local simulated repositories.

### Alternative H: Direct `tile.openstreetmap.org` Streaming Without Caching
* **Pros:** Zero cache configuration.
* **Cons:** Risks OpenStreetMap Tile Usage Policy throttling (`HTTP 403/429`) and leaves maps blank in 3G dead zones.
* **Reason for Rejection:** Unacceptable demo and cellular reliability risk. Replaced by `userAgentPackageName` configuration and `flutter_map`'s `BuiltInMapCachingProvider`.

--------------------------------------------------------------------------------

## Non-Functional Requirements

* **Security & Privacy:**
  * Prototype wallet balances represent simulated `Test Credits` only; no card numbers, national IDs, or banking credentials are collected.
  * Every wallet transfer generates a client-side `idempotency_key` (`UUIDv4`) and uses a 5-second synchronous confirmation timeout (`voided_to_cash` on cash fallback) to prevent duplicate debits.
  * Cabin TTS confirmations mask rider personal names by default (`"اتدفع 7 جنيه — كود 0123"`).
* **Performance, Usability & Battery:**
  * Driver dashboard controls enforce `>=48dp` touch targets and `>=4.5:1` WCAG AA contrast.
  * Map marker updates isolate from tile rendering so live position ticks do not flicker or reload map tiles.
  * Targets Android `8.0+` (`minSdk >= 23` for `mobile_scanner`) with `>=2 GB RAM`.
* **Rollout & Compatibility:**
  * `AppEnv` (`--dart-define=USE_MOCKS=true|false`) switches between Increment I local repositories and Increment II+ Track 2 endpoints without code edits.
  * `LocalWalletRepository` separates sandbox demo state cleanly so Increment II authentication clears prototype balances before live login.

--------------------------------------------------------------------------------

## Risks & Mitigations

| Risk / Failure Mode | Impact | Mitigation |
| :--- | :--- | :--- |
| **Missing `ar-EG` OS TTS Voice Pack or Muted Device** | Driver does not hear spoken payment receipts or waiting-rider alerts | Attempt `flutter_tts` initialization with graceful fallback; mirror every spoken event onto the high-contrast Driver shift ticker (`muted_fallback` status) |
| **4-Digit Vehicle Code Typo or QR Sticker Wear** | Rider credits the wrong microbus or fails to scan in back row | Place QR + 4-digit stickers in both front and back rows; enforce a pre-debit confirmation card displaying vehicle code, route name, and official fare |
| **Cellular Drop Mid-Payment** | Rider pays cash after timeout while delayed retry debits wallet | Bounded 5-second synchronous timeout marks attempt `voided_to_cash` and blocks retry of that `idempotency_key` before showing the cash-fallback fare |
| **OSM Public Tile Throttling (`403/429`)** | Blank map tiles during demos or field tests | Configure `userAgentPackageName` (`com.nqla.mobile_app`) and `BuiltInMapCachingProvider`; adopt self-hosted Alexandria PMTiles before public launch |
| **Cold-Start Partial Driver Coverage** | Non-app microbuses do not appear on the rider map | Display inline `boarding_cue_ar` windshield hints on route cards and add crowdsourced rider telemetry in future increments |

--------------------------------------------------------------------------------

## Additional Resources

* Project overview, `BR-01`–`BR-08`, and 4-track roadmap: [README.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/README.md)
* Separate Track 1 Web Admin Dashboard & Landing Page spec: [track1_admin_web_spec.md](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/docs/track1_admin_web_spec.md)
* Current Flutter dependencies: [pubspec.yaml](file:///d:/coding/NQLa-Intelligent-Microbus-Transport/apps/mobile-app/pubspec.yaml)

--------------------------------------------------------------------------------

## Future Improvements

* **Production Play Store Split:** Enable `rider` (`com.nqla.rider`) and `driver` (`com.nqla.driver`) Android build flavors so only the Driver app declares background location permissions.
* **Licensed PSP & Fawry Cash-Out:** Implement a CBE-licensed payment gateway adapter (`Paymob` / `Fawry Business` / `Meeza`) behind `WalletRepository` post-graduation.
* **Self-Hosted Alexandria PMTiles:** Serve Alexandria vector tiles from object storage/CDN (Protomaps PMTiles) for rate-limit-free, offline-first tile loading.
* **Crowdsourced Rider Telemetry:** Allow boarded riders using active route tracking to contribute anonymized corridor speed pings (`data_source: rider_crowdsourced`) to fill gaps when drivers are offline.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

This implementation plan covers **Increment I (Phases 0–3, 2-Week Demo)** exclusively, leaving zero architectural, schema, dependency, or file-boundary decisions to the implementer. Increments II–IV are summarized under *Future Increments* and will receive dedicated implementation specs once Track 2 backend contracts are ratified.

### Increment I Milestone Breakdown & Exit Checkpoints (Phases 0–3)

| Phase | Timeline | Deliverables & Exit Checkpoint |
| :--- | :--- | :--- |
| **Phase 0: Baseline, Contracts, Permissions & L10n** | Days 1–2 | Author `v1_mobile_contracts.md` (`v1-draft`) and `alexandria_corridors.json` (4 corridors + pre-authored plans); update `pubspec.yaml` (pinned versions + `generate: true`), `l10n.yaml`, `app_ar.arb`/`app_en.arb`, `AndroidManifest.xml` (`TTS_SERVICE` + permissions), `build.gradle.kts` (`minSdk = 23`), and `Info.plist`; fix `widget_test.dart` (`NQLaApp` + `material_ui`). **Exit gate:** `flutter pub get && flutter gen-l10n && flutter analyze && flutter test` passes. |
| **Phase 1: Core Infrastructure, Map & Bilingual Search** | Days 3–6 | Delete unused `.gitkeep` placeholders; implement `AppEnv`, `AppConstants`, `AppTheme`, `ArabicNormalizer`, all `lib/shared/models/`, `LocalFixtureRouteRepository`, `BaseOsmMap` (`BuiltInMapCachingProvider`), `SessionProvider` + `RoleSelectScreen`, `GoRouter` guards, `RiderMapScreen`, and `RouteResultsScreen` (including `"Waiting at Stop"` toggle). **Exit gate:** `flutter analyze && flutter test` passes with unit tests for normalizer, route fixtures, and router redirects. |
| **Phase 2: Simulated Wallet, QR/4-Digit Code & TTS** | Days 7–10 | Implement `LocalWalletRepository` (serialized async lock + `SharedPreferences` + receipt broadcast stream), `DriverTtsService` (`flutter_tts` `ar-EG` + FIFO queue + fallback ticker callback), `QrPayScreen` (camera scanner + 4-digit keypad + pre-debit confirmation card + cash-fallback voiding), `ActiveReceiptScreen`, and `RiderWalletScreen` (`"Add Demo Balance"`). **Exit gate:** `flutter analyze && flutter test` passes including wallet transfer, idempotency, void-on-offline, and TTS queue tests. |
| **Phase 3: Simulated Live GPS, Driver Shift & QA** | Days 11–14 | Implement `SimulatedTrackingRepository` (`RiderWaitSignal` + moving vehicle stream + staleness/cooldown simulation), `DemoSimulationDrawer` (UI triggers for `>15s` / `>60s` pause, simulated offline, waiting-rider proximity event), `DriverSetupScreen`, `DriverShiftScreen`, `DriverWalletScreen`, and `docs/traceability/track1_mobile_matrix.md`. **Exit gate:** `flutter analyze && flutter test && flutter build apk --release` passes plus CUJs 1–5 verified on physical Android hardware. |

### Future Increments (Beyond Increment I — Out of Current File Boundary)

* **Increment II (Months 2–3):** Jointly ratify `v1` contracts with Track 2; add `dio_client.dart`, `ws_client.dart` (`web_socket_channel`), `sqflite` offline GPS queue, `flutter_secure_storage` JWT auth (`features/auth/`), Android Foreground GPS Service (`geolocator` + `flutter_foreground_task` + `short_turn_stop_id`), `X-Request-ID` / `schema_version` telemetry, and `features/rider/feedback/`.
* **Increments III–IV (Months 3–5+):** Add `DemandHeatmapLayer` and incentive alerts inside `features/driver/`, driver safety score views, `features/rider/agent/` AI chat UI proxied through Track 2, and `rider` / `driver` Android build flavors.

### Locked Increment I Specifications (Zero-Decision Reference)

* **Locked `pubspec.yaml` Additions & Pins:**
  * Keep existing: `flutter_map: ^8.3.2`, `latlong2: ^0.10.1`, `go_router: ^18.1.4`, `provider: ^6.1.5+1`, `dio: ^5.11.1`, `material_ui: ^1.11.1`, `cupertino_icons: ^1.0.8`.
  * Add: `flutter_localizations: { sdk: flutter }`, `intl: ^0.20.2`, `shared_preferences: ^2.5.6`, `mobile_scanner: ^7.5.0`, `flutter_tts: ^4.2.5`, `uuid: ^4.6.0`.
  * Under `flutter:` set `generate: true` and `assets: [assets/fixtures/alexandria_corridors.json]`.
* **Locked `l10n.yaml` Settings:**
  * `arb-dir: lib/core/l10n`, `template-arb-file: app_ar.arb`, `output-localization-file: app_localizations.dart`, `output-class: AppLocalizations`, `synthetic-package: false`, `output-dir: lib/core/l10n/generated`.
  * Supported `MaterialApp.router` locales: `[Locale('ar'), Locale('en')]` (default `Locale('ar')` RTL); `DriverTtsService` sets language `'ar-EG'`.
* **Locked `AppConstants` & `AppEnv` Values:**
  * `AppEnv`: `useMocks` (`bool.fromEnvironment('USE_MOCKS', defaultValue: true)`), `apiBaseUrl` (`String.fromEnvironment('API_BASE_URL', defaultValue: '')`), `wsUrl` (`String.fromEnvironment('WS_URL', defaultValue: '')`).
  * Map center & bounds: `defaultCenter = LatLng(31.2001, 29.9187)`, `defaultZoom = 13.0`, `minZoom = 11.0`, `maxZoom = 17.0`, `alexandriaBounds = LatLngBounds(LatLng(31.08, 29.75), LatLng(31.33, 30.08))`, `osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'`, `userAgentPackageName = 'com.nqla.mobile_app'`.
  * Timings & thresholds: `vehicleStaleDimSeconds = 15`, `vehicleExpireSeconds = 60`, `proximityTriggerMeters = 250`, `proximityCooldownSeconds = 45`, `waitSignalTtlSeconds = 600`, `paymentTimeoutSeconds = 5`, `simulationTickMs = 1500`.
* **Locked Alexandria Demo Seed Dataset (`alexandria_corridors.json`):**
  * **Corridors (exact 4):**
    1. `C1`: El-Mandara <-> El-Mansheya (Corniche) — `official_fare_egp: 8.0`, demo `vehicle_code: "0123"`, `boarding_cue_ar: "ميكروباص الكورنيش — المندرة / المنشية"`.
    2. `C2`: Victoria <-> Mahatet Masr (Abu Qir) — `official_fare_egp: 7.0`, demo `vehicle_code: "0456"`, `boarding_cue_ar: "أبو قير — محطة مصر / فيكتوريا"`.
    3. `C3`: El-Awayed <-> Mahatet Masr (El-Mahmoudia) — `official_fare_egp: 7.0`, demo `vehicle_code: "0789"`, `boarding_cue_ar: "المحمودية — محطة مصر / العوايد"`.
    4. `C4`: El-Agami <-> El-Mansheya — `official_fare_egp: 10.0`, demo `vehicle_code: "1042"`, `boarding_cue_ar: "العجمي — البيطاش / المنشية"`.
  * **Transfer & Query Lookup:** `alexandria_corridors.json` stores stops (each with `id`, `name_ar`, `name_en`, `aliases[]` covering Arabic & Franco-Arabic spellings, `road_side`, `{lat, lng}`) plus a `precomputed_plans[]` list of direct and 1-transfer `JourneyPlan`s (with 5-minute walk legs at `4.5 km/h` between Sidi Gaber / Mahatet Masr / El-Mansheya transfer stops). `LocalFixtureRouteRepository` normalizes query text via `ArabicNormalizer` (`أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`, strip diacritics, `٠-٩ -> 0-9`), matches stop `aliases[]` (case-insensitive substring), and returns matching pre-authored `JourneyPlan`s (or empty list with `"لا توجد خطوط مطابقة في البيانات التجريبية"`).
* **Locked QR Format & `LocalWalletRepository` Rules:**
  * **QR Payload:** URI string `nqla://pay?v=<4-digit>` (for example `nqla://pay?v=0123`) or raw 4-digit string `"0123"`. Any scanned payload not matching `^(?:nqla://pay\?v=)?(\d{4})$` after Eastern-digit conversion (`٠-٩ -> 0-9`) displays `"كود غير صالح"` and keeps the scanner open.
  * **Persistence & Concurrency:** Stored under `SharedPreferences` key `'nqla_wallet_v1'` as a single JSON document (`rider_balance_egp: 100.0` initial, `driver_balance_egp: 0.0` initial, `transactions: List<WalletTransaction>`). All mutations serialize through an in-memory `Future<void>` mutex chain inside `LocalWalletRepository`.
  * **Demo Top-Up & Limits:** `"Add Demo Balance"` credits `+50.0` EGP to Rider balance. `seat_count` range is `1..14`. `idempotency_key` (`UUIDv4`) is created when opening confirmation on `/rider/pay` and reused if retrying the same confirmation; if `isSimulatedOffline` is enabled or `5s` timeout fires, `LocalWalletRepository` records that `idempotency_key` in an in-memory void set (`voided_to_cash`), returns `WalletTransferReceipt(status: voidedToCash)`, and returns `"ادفع {fare} جنيه كاش للسواق"`.
  * **Cross-Role Receipt Stream:** `LocalWalletRepository` exposes `Stream<WalletTransferReceipt> get receiptStream`. When `DriverShiftProvider` is active, it subscribes to `receiptStream` and invokes `DriverTtsService.speakPayment(...)`; on `ActiveReceiptScreen`, the `"Preview Driver TTS"` button invokes `DriverTtsService.speakPayment(...)` directly.
* **Locked Model Types (`lib/shared/models/`):**
  * `GeoPoint`: `{ double lat, double lng }`
  * `UserRole` enum: `unselected`, `rider`, `driver`
  * `StopPoint`: `{ String id, String nameAr, String nameEn, List<String> aliases, String roadSide, GeoPoint location }`
  * `RouteCorridor`: `{ String id, String code, String nameAr, String nameEn, double officialFareEgp, String boardingCueAr, String demoVehicleCode, List<GeoPoint> polyline, List<StopPoint> stops }`
  * `JourneyLegType` enum: `ride`, `walk`; `JourneyLeg`: `{ JourneyLegType type, String? routeId, String? routeCode, double fareEgp, String fromLandmarkAr, String toLandmarkAr, String? alightingPhraseAr, String? boardingCueAr, int durationMin, List<GeoPoint> path }`
  * `JourneyPlan`: `{ String planId, double totalFareEgp, int totalDurationMin, List<JourneyLeg> legs }`
  * `RiderWaitStatus` enum: `waiting`, `boarded`, `cancelled`; `RiderWaitSignal`: `{ String signalId, String routeId, GeoPoint location, int ttlSec, RiderWaitStatus status, DateTime createdAtUtc }`
  * `TelemetrySource` enum: `simulated`, `live`, `riderCrowdsourced`; `VehicleLocationUpdate`: `{ String vehicleId, String vehicleCode, String routeId, GeoPoint location, double headingDeg, int seatsAvailable, int sequenceId, DateTime timestampUtc, TelemetrySource dataSource }`
  * `TransferStatus` enum: `confirmed`, `failed`, `voidedToCash`; `WalletTransferRequest`: `{ String idempotencyKey, String vehicleCode, int seatCount, double? expectedFareEgp, DateTime clientTimestampUtc }`; `WalletTransferReceipt`: `{ String txId, TransferStatus status, double amountEgp, int seatCount, String vehicleCode, String routeId, String? riderDisplayLabel, DateTime serverTimestampUtc, String? failureReason }`
  * `WalletAccount`: `{ String ownerId, UserRole role, double balanceEgp }`; `WalletTransaction`: `{ String txId, String idempotencyKey, String vehicleCode, String routeId, double amountEgp, int seatCount, TransferStatus status, DateTime timestampUtc }`
  * `NearbyRiderAlert`: `{ String alertId, String zoneLandmarkAr, int waitingCount, int distanceMeters, String routeId, DateTime timestampUtc }`

### Target Files to Create, Modify, or Delete (Increment I Write Allowlist)

#### A. Contracts, Documentation & Fixtures
1. **`docs/api_contracts/v1_mobile_contracts.md`** *(Create)*
   * **Type / Scope:** Cross-Track Provisional JSON Specification (`v1-draft`)
   * **Proposed Changes:** Document exact JSON schemas matching the locked models above plus provisional Increment II REST/WebSocket endpoint signatures (`GET /api/v1/routes`, `POST /api/v1/journeys/plan`, `POST /api/v1/wait-signals`, `POST /api/v1/wallet/transfer`, `POST /api/v1/wallet/void`, `WS /ws/v1/tracking`) and standard error envelope (`{ "error_code": string, "message": string }`).
2. **`docs/traceability/track1_mobile_matrix.md`** *(Create — Phase 3)*
   * **Type / Scope:** Academic Traceability Document
   * **Proposed Changes:** Map `BR-01`–`BR-08` -> `UR` -> `FR` -> `apps/mobile-app` screens/repositories (`Passenger` mapped to `Rider`).
3. **`apps/mobile-app/assets/fixtures/alexandria_corridors.json`** *(Create)*
   * **Type / Scope:** Bundled Demo Dataset
   * **Proposed Changes:** Author the 4 Alexandria corridors (`C1`–`C4`), stops with Arabic/Franco-Arabic `aliases[]`, `boarding_cue_ar`, demo `vehicle_code`s, and `precomputed_plans[]`.

#### B. App Configuration, Permissions & Localization
4. **`apps/mobile-app/pubspec.yaml`** *(Modify)*
   * **Type / Scope:** Dependency & Asset Configuration
   * **Proposed Changes:** Add pinned Increment I dependencies (`flutter_localizations`, `intl: ^0.20.2`, `shared_preferences: ^2.5.6`, `mobile_scanner: ^7.5.0`, `flutter_tts: ^4.2.5`, `uuid: ^4.6.0`), keep `material_ui: ^1.11.1`, set `generate: true`, and uncomment `assets:` for `assets/fixtures/alexandria_corridors.json`.
5. **`apps/mobile-app/l10n.yaml`** *(Create)*
   * **Type / Scope:** Localization Generator Config
   * **Proposed Changes:** Configure `arb-dir`, `template-arb-file`, `output-localization-file`, `output-class`, `synthetic-package: false`, and `output-dir`.
6. **`apps/mobile-app/lib/core/l10n/app_ar.arb`** *(Create)*
   * **Type / Scope:** Arabic Localization Strings
   * **Proposed Changes:** Define all Rider/Driver UI labels (`"أنا مستني هنا"`, `"ممتلئ / لا يتوقف"`, `"إضافة رصيد تجريبي"`, `"ادفع {fare} جنيه كاش للسواق"`, TTS speech templates, error labels).
7. **`apps/mobile-app/lib/core/l10n/app_en.arb`** *(Create)*
   * **Type / Scope:** English Localization Strings
   * **Proposed Changes:** Define matching English UI strings (`"Waiting at Stop"`, `"Full / Not Stopping"`, `"Add Demo Balance"`, `"Pay {fare} EGP cash to driver"`).
8. **`apps/mobile-app/lib/core/l10n/generated/app_localizations.dart`, `app_localizations_ar.dart`, `app_localizations_en.dart`** *(Generated by `flutter gen-l10n`)*
   * **Type / Scope:** Generated Localization Code
   * **Proposed Changes:** Generated output consumed by `NQLaApp` and feature screens.
9. **`apps/mobile-app/android/app/src/main/AndroidManifest.xml`** *(Modify)*
   * **Type / Scope:** Android Permissions & TTS Engine Visibility
   * **Proposed Changes:** Add `INTERNET` (required for release-build tile/network requests), `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA`, and `POST_NOTIFICATIONS`; update `android:label` to `NQLa`; add `<intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>` inside `<queries>` (leave Increment II `FOREGROUND_SERVICE` permissions omitted until Increment II).
10. **`apps/mobile-app/android/app/build.gradle.kts`** *(Modify)*
    * **Type / Scope:** Android Gradle Build Config
    * **Proposed Changes:** Set `minSdk = 23` inside `defaultConfig` (required by `mobile_scanner: ^7.5.0`).
11. **`apps/mobile-app/ios/Runner/Info.plist`** *(Modify)*
    * **Type / Scope:** iOS Permissions & Branding
    * **Proposed Changes:** Set `CFBundleDisplayName` to `NQLa`; add `NSLocationWhenInUseUsageDescription` and `NSCameraUsageDescription`.

#### C. Core Infrastructure & Shared Layer
12. **`apps/mobile-app/lib/core/config/app_env.dart`** *(Create)*
    * **Type / Scope:** Environment Flags
    * **Proposed Changes:** Expose compile-time `--dart-define` values (`useMocks`, `apiBaseUrl`, `wsUrl`).
13. **`apps/mobile-app/lib/core/constants/app_constants.dart`** *(Create; replaces `core/constants/.gitkeep`)*
    * **Type / Scope:** Locked Constants
    * **Proposed Changes:** Store Alexandria map coordinates/bounds, tile URL, `userAgentPackageName`, staleness thresholds, TTS radius/cooldown, `paymentTimeoutSeconds`, and `SharedPreferences` keys.
14. **`apps/mobile-app/lib/core/theme/app_theme.dart`** *(Create; replaces `core/theme/.gitkeep`)*
    * **Type / Scope:** Theme & Accessibility Targets
    * **Proposed Changes:** Define Rider Material theme and high-contrast Driver theme (`>=48dp` minimum button height, `>=4.5:1` foreground/background contrast).
15. **`apps/mobile-app/lib/core/utils/arabic_normalizer.dart`** *(Create)*
    * **Type / Scope:** Text & Digit Normalization Utility
    * **Proposed Changes:** Normalize Arabic characters (`أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`, remove diacritics), convert Eastern Arabic numerals (`٠-٩ -> 0-9`), and parse `nqla://pay?v=XXXX` or 4-digit codes.
16. **`apps/mobile-app/lib/core/audio/driver_tts_service.dart`** *(Create)*
    * **Type / Scope:** Speech & Fallback Service
    * **Proposed Changes:** Implement `DriverTtsService` wrapping `FlutterTts`: configure `awaitSpeakCompletion(true)`, set `'ar-EG'`, maintain FIFO speech queue, apply zone cooldown suppression (`45s`), catch missing-voice/muted errors gracefully, and invoke ticker callback on every queued announcement.
17. **Shared Models (`apps/mobile-app/lib/shared/models/`)** *(Create 10 files)*
    * `geo_point.dart`, `user_role.dart`, `stop_point.dart`, `route_corridor.dart`, `journey_plan.dart`, `rider_wait_signal.dart`, `vehicle_location.dart`, `wallet_models.dart`, `nearby_rider_alert.dart`, `models.dart` (barrel).
    * **Proposed Changes:** Immutable Dart classes with `fromJson`/`toJson` matching the locked schemas above.
18. **Shared Repositories (`apps/mobile-app/lib/shared/repositories/`)** *(Create 6 files)*
    * Interfaces: `route_repository.dart`, `tracking_repository.dart`, `wallet_repository.dart`.
    * Increment I implementations: `local_fixture_route_repository.dart`, `simulated_tracking_repository.dart`, `local_wallet_repository.dart`.
    * **Proposed Changes:** Implement fixture loading/alias search (`LocalFixtureRouteRepository`), polyline vehicle interpolation + `RiderWaitSignal` + `NearbyRiderAlert` + pause/proximity simulation triggers (`SimulatedTrackingRepository`), and serialized `SharedPreferences` ledger + `idempotency_key` voiding + `receiptStream` (`LocalWalletRepository`).
19. **Shared Map & Demo Widgets (`apps/mobile-app/lib/shared/widgets/`)** *(Create 3 files; replaces `shared/widgets/.gitkeep`)*
    * `base_osm_map.dart`, `map_layers.dart`, `demo_simulation_drawer.dart`.
    * **Proposed Changes:** `BaseOsmMap` (`FlutterMap` + `BuiltInMapCachingProvider` + zoom bounds), modular `RoutePolylineLayer` / `StopsMarkerLayer` / `LiveVehiclesLayer` (`ValueNotifier` owned and disposed by `RiderMapProvider`, dimming `>15s`, hiding `>60s`), and `DemoSimulationDrawer` exposing `"Pause GPS"`, `"Toggle Simulated Offline"`, and `"Simulate Waiting Rider (250m)"`.

#### D. Feature Modules, Routing & Entrypoint
20. **Unused Scaffold `.gitkeep` Cleanup** *(Delete 10 files)*
    * Delete exact files:
      * `apps/mobile-app/lib/core/constants/.gitkeep`
      * `apps/mobile-app/lib/core/router/.gitkeep`
      * `apps/mobile-app/lib/core/theme/.gitkeep`
      * `apps/mobile-app/lib/shared/widgets/.gitkeep`
      * `apps/mobile-app/lib/features/auth/screens/.gitkeep`
      * `apps/mobile-app/lib/features/driver/screens/.gitkeep`
      * `apps/mobile-app/lib/features/map/screens/.gitkeep`
      * `apps/mobile-app/lib/features/ride/screens/.gitkeep`
      * `apps/mobile-app/lib/features/feedback/screens/.gitkeep`
      * `apps/mobile-app/lib/features/agent/screens/.gitkeep`
21. **Auth / Demo Session Slice (`apps/mobile-app/lib/features/auth/`)** *(Create 2 files)*
    * `apps/mobile-app/lib/features/auth/providers/session_provider.dart`
    * `apps/mobile-app/lib/features/auth/screens/role_select_screen.dart`
    * **Proposed Changes:** Manage `UserRole` (`unselected`, `rider`, `driver`), demo `userId`, and role-exit cleanup hook.
22. **Rider Feature Slice (`apps/mobile-app/lib/features/rider/`)** *(Create 7 files; zero imports from `features/driver/`)*
    * `providers/rider_map_provider.dart` (search state, `ValueNotifier<List<VehicleLocationUpdate>>`, wait-signal toggle + disposal)
    * `providers/rider_wallet_provider.dart` (balance, pre-debit vehicle lookup, `idempotency_key` management, 5s timeout & `voided_to_cash` state)
    * `screens/rider_map_screen.dart` (search bar, `BaseOsmMap`, `"Waiting at Stop"` toggle, bottom action bar, `DemoSimulationDrawer` access)
    * `screens/route_results_screen.dart` (route leg cards, `boarding_cue_ar`, walk duration, fare breakdown, `"Waiting at Stop"` action)
    * `screens/qr_pay_screen.dart` (`mobile_scanner` QR view + 4-digit keypad + pre-debit confirmation card + cash-fallback banner)
    * `screens/active_receipt_screen.dart` (high-contrast paid receipt + `"Preview Driver TTS"` button)
    * `screens/rider_wallet_screen.dart` (`Test Credits` balance, transaction history, `"Add Demo Balance"`)
23. **Driver Feature Slice (`apps/mobile-app/lib/features/driver/`)** *(Create 4 files; zero imports from `features/rider/`)*
    * `providers/driver_shift_provider.dart` (subscribes to `trackingRepository.watchNearbyRiderAlerts` and `walletRepository.receiptStream`, enforces `Full / Not Stopping` suppression, disposes streams and stops `DriverTtsService` on exit)
    * `screens/driver_setup_screen.dart` (select active corridor `C1`–`C4` and enter shift)
    * `screens/driver_shift_screen.dart` (`On Shift / Off` and `Full / Not Stopping` `>=48dp` toggles, live payment/alert ticker, `"Simulate Boarding Payment"` demo action, `DemoSimulationDrawer` access)
    * `screens/driver_wallet_screen.dart` (daily simulated earnings balance and credit history)
24. **`apps/mobile-app/lib/core/router/app_router.dart`** *(Create)*
    * **Type / Scope:** Declarative Router
    * **Proposed Changes:** `GoRouter` with `initialLocation: '/role-select'`, `refreshListenable: sessionProvider`, role-mismatch redirects, `/rider/*` routes (passing selected `JourneyPlan` or `WalletTransferReceipt` via `extra`), and `/driver/*` routes.
25. **`apps/mobile-app/lib/main.dart`** *(Modify)*
    * **Type / Scope:** Composition Root
    * **Proposed Changes:** Keep `package:material_ui/material_ui.dart`; initialize `SharedPreferences`, repositories, `DriverTtsService`, `SessionProvider`, `AppRouter`, `AppLocalizations` delegates (`ar`, `en`), and `MaterialApp.router`.

#### E. Automated Tests
26. **`apps/mobile-app/test/widget_test.dart`** *(Modify)*
    * **Type / Scope:** Widget Smoke & Integration Test
    * **Proposed Changes:** Replace `package:flutter/material.dart` with `package:material_ui/material_ui.dart` and `MyApp` with `NQLaApp` (injected with test `SharedPreferences.setMockInitialValues({})` and fake tile provider avoiding live HTTP calls). Assert role-select buttons render, switching to Rider navigates to `/rider/map`, and `TextField` renders RTL cleanly.
27. **`apps/mobile-app/test/arabic_normalizer_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests
    * **Proposed Changes:** Test Arabic letter normalization (`أ/إ/آ -> ا`, `ة -> ه`, `ى -> ي`), Eastern Arabic digits (`٠١٢٣ -> 0123`), QR URI parsing (`nqla://pay?v=0123` -> `"0123"`), and invalid QR rejection.
28. **`apps/mobile-app/test/local_fixture_route_repository_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests
    * **Proposed Changes:** Test loading 4 corridors from fixture JSON, bilingual/Franco-Arabic alias search (`"محطة مصر"` and `"ma7atet masr"`), 1-transfer plan resolution, and empty-result handling.
29. **`apps/mobile-app/test/local_wallet_repository_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests
    * **Proposed Changes:** Test initial balances (`100.0` / `0.0`), `"Add Demo Balance"` (`+50.0`), valid QR/`"0123"` transfer updating both balances and emitting on `receiptStream`, duplicate `idempotency_key` deduplication, insufficient-balance failure without balance mutation, and simulated-offline `voided_to_cash` blocking subsequent retry of the same `idempotency_key`.
30. **`apps/mobile-app/test/simulated_tracking_repository_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests
    * **Proposed Changes:** Test moving vehicle stream emissions along `C1`–`C4`, `>15s` stale and `>60s` expired timestamps when paused, and `RiderWaitSignal` triggering `NearbyRiderAlert` within `250m` and clearing on cancel/boarding.
31. **`apps/mobile-app/test/driver_tts_service_test.dart`** *(Create)*
    * **Type / Scope:** Unit Tests (mocked `FlutterTts`)
    * **Proposed Changes:** Test FIFO queueing of two back-to-back receipts, `45s` zone cooldown suppression, `"Full / Not Stopping"` proximity suppression, and ticker callback firing when TTS throws or device is muted.
32. **`apps/mobile-app/test/app_router_test.dart`** *(Create)*
    * **Type / Scope:** Widget / Navigation Tests
    * **Proposed Changes:** Test `initialLocation` (`/role-select`), redirecting `/rider/map` -> `/role-select` when `UserRole.unselected`, redirecting `/driver/shift` -> `/role-select` when `UserRole.rider`, and verifying role-exit cleanup cancels active shift state.

### Verification Plan

* **Static Analysis:** Run `flutter analyze` inside `apps/mobile-app` — must exit `0` with zero errors, warnings, or deprecation infos.
* **Unit & Widget Tests:** Run `flutter test` inside `apps/mobile-app` — all 7 test files (`widget_test.dart` + 6 unit/router suites) must pass with zero skipped tests.
* **Release APK Build:** Run `flutter build apk --release` inside `apps/mobile-app` — must succeed with zero Gradle/manifest errors.
* **Manual End-to-End Demo Walkthrough (CUJs 1–5 on Physical Android Device):**
  1. Launch on `/role-select`, choose Rider, search `"محطة مصر"` and `"ma7atet masr"`, confirm multi-transfer leg cards, `boarding_cue_ar`, walk segment, and official EGP fare render on `BaseOsmMap`.
  2. Tap `"Waiting at Stop"`, observe simulated microbuses moving on corridor `C2`, open `DemoSimulationDrawer` -> tap `"Pause GPS"`, and verify markers dim after `15s` and disappear after `60s`.
  3. Open `/rider/pay`, test both QR scan (`nqla://pay?v=0123`) and 4-digit code (`٠١٢٣`), verify the pre-debit confirmation card shows `C1` + `8.0 EGP`, confirm payment, verify `"Active Paid Receipt"` shows, and tap `"Preview Driver TTS"` to hear Egyptian Arabic speech.
  4. Toggle `"Simulate Offline"` in `DemoSimulationDrawer`, retry payment, and confirm `"ادفع 8 جنيه كاش للسواق"` appears with zero wallet balance change and no auto-retry on reconnect.
  5. Switch to Driver Mode (`/driver/setup` -> `C1` -> `/driver/shift`), tap `"On Shift"`, trigger `"Simulate Waiting Rider (250m)"` in `DemoSimulationDrawer`, verify Arabic TTS alert plays once per `45s` cooldown and stops when `"Full / Not Stopping"` is toggled.
