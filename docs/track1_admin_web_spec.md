# Track 1: Main Website & Admin Dashboard — Specification & Architecture Document

> **Document Status:** Draft (In Discovery)  
> **Target Scope:** Track 1 (Mobile & Admin Frontend) — Sub-scope: Public Website & Admin Dashboard (`admin_dashboard`)  
> **Associated Domain:** `nq8la.tech` / `admin.nq8la.tech`  
> **Related Requirements:** BR-07 (System Reports & Alerts), BR-08 (Zero Hardware / Smartphone GPS only)

---

## 1. The Problem and the User

### 1.1 Problem Statement
- **Current Reality:** Informal microbuses in Alexandria operate without central dispatching or monitoring. When routes bottleneck, demand surges, or safety violations occur, there is zero visibility into fleet positions, passenger queues, or line-level service failures.
- **Sub-Problems for Track 1:**
  1. **Public Web Portal (`nq8la.tech`):** Commuters, drivers, academic evaluators, and external stakeholders have no single access point to understand the platform, access APK distributions, or inspect live network health.
  2. **Admin Command Dashboard (`admin.nq8la.tech`):** Transit supervisors or project evaluators lack an operational tool to monitor live vehicle positions (`BR-08`), detect spatial demand imbalances (`BR-03`/`BR-04`), inspect driver safety scores (`BR-05`), and triage safety complaints processed from colloquial Egyptian text (`BR-06`).

### 1.2 Target User Personas
*Status: Open for validation.*
- **Persona A: Academic Evaluator & Project Jury (Immediate User)**
  - Context: Evaluates the project against academic metrics (`BR-01` through `BR-08`).
  - Need: Needs to see live simulation replays, incoming GPS telemetry, real-time alert triggers (`BR-07`), and verify that backend AI models are connected.
- **Persona B: Transit Dispatcher / Station Supervisor (Theoretical Field User)**
  - Context: Manages line allocations at major Alexandria transport hubs (e.g., Mahatet Masr, Sidi Gaber, Al-Awayed, El-Mawqaf El-Gadid).
  - Constraints: Desktop or tablet device, intermittent network, requires high-contrast UI and Arabic/English language support.
- **Persona C: Public Passenger / Driver (Landing Page User)**
  - Context: Visiting `nq8la.tech` on mobile/desktop browsers to download the apps or check coverage.

---

## 2. Goal and Definition of "Done"
*Status: Pending completion of Section 1.*

- **Success Metrics:**
  - Real-time ingestion and map rendering of driver GPS coordinates without UI stutter.
  - Delivery of system alerts (`BR-07`) within 3 seconds of triggering condition.
  - Full display of held-out evaluation reports for academic submission.

---

## 3. Scope: The MVP
*Status: Pending.*

- **Core 3 Must-Have Features for Admin Dashboard MVP:**
  1. Live Alexandria Fleet & Route Map (`flutter_map` / OpenStreetMap) showing active driver nodes.
  2. Operations & Alerts Center (`BR-07`): Active route bottlenecks, safety threshold breaches, and wait-time spikes.
  3. AI Intelligence Hub: Visual panels for Demand Forecast Heatmaps (`BR-03`) and Classified Egyptian Arabic Complaints (`BR-06`).
- **Deferred to Later:**
  - Full user account management & RBAC.
  - Direct fare/monetary penalty settlement.
  - Custom drag-and-drop report builder.

---

## 4. Existing Solutions & Gaps
*Status: Pending.*

- **Traditional Fleet Management (e.g., Cartrack, Teltonika):** Require proprietary OBD-II / CAN bus hardware ($150+ per vehicle), violating `BR-08`.
- **Public Transit Dashboards (e.g., Cairo Metro / Alexandria Tram):** Fixed schedules, closed proprietary networks, non-applicable to paratransit microbuses.

---

## 5. Platform Choice
*Status: Under Review.*

- **Admin Dashboard:** Flutter Web (`apps/admin_dashboard`).
- **Landing Page:** Needs decision: Flutter Web vs Lightweight Static HTML/Tailwind.

---

## 6. Core User Flows & Wireframes
*Status: Pending.*

---

## 7. Data and Architecture
*Status: Pending.*

- WebSocket ingestion for real-time driver coordinates.
- REST integration for aggregated metrics and NLP complaints.

---

## 8. Tech Stack Rationale
*Status: Drafted in Root README.*

---

## 9. Constraints and Risks
*Status: Pending.*

- **Key Technical Risk:** Rendering dozens of live moving markers on Flutter Web without canvas lag.
- **Key Operational Risk:** Unstable 4G/GPS connections on driver smartphones.

---

## 10. Milestone Plan
*Status: Aligned with 4-Sprint Increment Plan.*
