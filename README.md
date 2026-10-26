# 🚐 NQLa (نقلة) — AI-Powered Intelligent Microbus Transportation Platform

> **Graduation Project (2026–2027)** | **Location:** Alexandria, Egypt  
> **Supervisor:** Prof. Saleh Mesbah  
> **Methodology:** Agile (Scrum — 2-Week Sprints)

---

## 📖 1. Project Overview

**NQLa** is an AI-powered mobile and web platform designed to modernize and organize the informal microbus network in Alexandria, Egypt. Currently, the network operates without fixed timetables, digital route directories, or visibility between waiting passengers and operating drivers.

NQLa bridges this gap without requiring any expensive in-vehicle hardware—relying purely on the driver's smartphone GPS—by delivering:
- **Route & Multi-Transfer Planning** across Alexandria's microbus stops and lines.
- **Real-Time Ride Matching & Trip Tracking** to minimize passenger waiting times.
- **Egyptian Arabic & Franco-Arabic NLP** to analyze passenger feedback, sentiment, and safety complaints.
- **Spatiotemporal Demand Forecasting & Dynamic Incentives** to balance microbus supply and passenger demand.
- **Driver Safety Scoring** for continuous service quality monitoring.
- **Transportation AI Agent** combining LLMs, verified retrieval, and system tools to assist users and administrators.

---

## 🛠️ 2. Tech Stack

All technologies are selected to ensure **zero licensing or hardware costs** (`BR-08`):

| Layer | Technologies |
| :--- | :--- |
| **Mobile & Admin Frontend** | `Flutter` (Passenger App, Driver App, Admin Dashboard), `OpenStreetMap` |
| **Backend & Geospatial Core** | `Python`, `FastAPI`, `PostgreSQL` + `PostGIS`, `WebSockets`, `Docker` |
| **Machine Learning & Optimization** | `Scikit-Learn`, `PyTorch` / `LightGBM`, Spatiotemporal Simulation |
| **NLP & AI Agent** | `HuggingFace Transformers` (Egyptian Arabic / Franco-Arabic), `LangChain` / Tool-Calling Agent |

---

## 🎯 3. Scope & Business Requirements Traceability

### Scope Boundaries (Release 1.0)
- ✅ **In Scope:** Alexandria routes/stops, Passenger/Driver/Admin UIs, Transportation AI Agent, Ride Matching, Demand Forecasting & Incentives, Egyptian/Franco-Arabic Feedback & Safety Scoring.
- ❌ **Out of Scope:** Operations outside Alexandria, online payment/fare settlement, dedicated in-vehicle hardware, external transit authority integration.

### Business Requirements (`BR`) Matrix

| ID | Objective | Success Indicator (Evaluation Metric) | Owner Track |
| :--- | :--- | :--- | :--- |
| **BR-01** | Reduce passenger waiting time through ride matching | Average passenger waiting time (Simulated & Held-out) | Track 2 & Track 3 |
| **BR-02** | Reliable route and transfer information | Share (%) of dataset routes and stops covered | Track 2 & Track 4 |
| **BR-03** | Forecast demand by area and time | Forecast error (MAE / RMSE) on held-out data | Track 3 |
| **BR-04** | Distribute drivers evenly through incentives | Supply-demand gap reduction & incentive efficiency | Track 3 |
| **BR-05** | Improve safety through driver safety scores | Coverage and stability of driver safety scores | Track 3 & Track 4 |
| **BR-06** | Understand Egyptian Arabic & Franco-Arabic feedback | Sentiment & complaint classification quality (F1-Score) | Track 4 |
| **BR-07** | Provide administrators with reports and alerts | Availability and timeliness of system reports/alerts | Track 1 & Track 2 |
| **BR-08** | Operate without in-vehicle hardware | Zero additional hardware cost per vehicle (Smartphone GPS) | Track 1 |

---

## 👥 4. Team Structure & Work Distribution

To prevent integration bottlenecks, the team is divided into **2 Core Streams** and **4 Specialized Sub-Tracks**:

### 📱 Stream A: Application & Geospatial Core

#### **Track 1: Mobile & Admin Frontend (`Flutter` + `OpenStreetMap`)**
- **Responsibilities:**
  - Build Passenger App, Driver App, and Administrator Dashboard.
  - Capture live GPS streams directly from the driver's smartphone (`BR-08`).
  - Render `OpenStreetMap` routes, stops, heatmaps, and live trip tracking.
  - Build the chat UI for the Transportation AI Agent and Admin reporting views (`BR-07`).

#### **Track 2: Backend, Geospatial DB & Matching Engine (`FastAPI` + `PostGIS`)**
- **Responsibilities:**
  - Clean and structure the Alexandria microbus route and stop dataset (`BR-02`).
  - Implement `PostGIS` spatial queries and multi-transfer graph routing algorithms.
  - Develop the real-time Ride-Matching Engine (`BR-01`) and WebSocket GPS ingestion.
  - Expose REST APIs and integrate AI microservices every sprint.

---

### 🧠 Stream B: AI, NLP & Predictive Models

#### **Track 3: Spatiotemporal ML, Safety & Simulation (`Python`)**
- **Responsibilities:**
  - Build the Spatiotemporal Demand Forecasting model across Alexandria zones (`BR-03`).
  - Design the Dynamic Driver Incentive recommendation engine (`BR-04`).
  - Implement the Driver Safety Scoring algorithm (`BR-05`).
  - Build the synthetic traffic & passenger simulation environment to evaluate matching and incentives without requiring thousands of live users.

#### **Track 4: Egyptian Arabic NLP & Transportation AI Agent (`NLP` + `LLMs`)**
- **Responsibilities:**
  - Build preprocessing and transliteration pipelines for Egyptian Arabic and Franco-Arabic text.
  - Train and evaluate sentiment, complaint, and safety-concern classifiers (`BR-06`).
  - Develop the Transportation AI Agent combining verified route retrieval (`PostGIS`) and approved tool calls (Forecasting, Routing, NLP) with strict safety guardrails.

---

## 🗓️ 5. Incremental Roadmap (4 Milestones)

Work is organized into **4 sequential increments**, executed via **2-week Scrum sprints**:

| Increment | Theme | Track 1 (Flutter / UI) | Track 2 (FastAPI / PostGIS) | Track 3 (Demand ML & Safety) | Track 4 (Arabic NLP & Agent) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Increment I** | **Alexandria Route & Stop Dataset** | Auth, `OpenStreetMap` view, route search UI | Clean Alexandria dataset, setup `PostGIS`, route & transfer API | Audit public mobility data; build Alexandria traffic simulator | Collect Egyptian & Franco-Arabic feedback data; preprocessing |
| **Increment II** | **Egyptian Arabic NLP** | Feedback & rating screens, driver profile UI | Ride-matching engine (`BR-01`), live GPS WebSockets, `/feedback` API | Build & validate Driver Safety Score module (`BR-05`) | Train & wrap Sentiment/Complaint NLP models (`BR-06`) in FastAPI |
| **Increment III** | **Demand Forecasting & Incentives** | Driver heatmap, incentive alerts UI, Admin Dashboard (`BR-07`) | Connect ML forecasts to DB; Admin reports & alert endpoints | Deliver Demand Forecasting (`BR-03`) & Incentive Engine (`BR-04`) | Prototype AI Agent tool-calling & verified route retrieval |
| **Increment IV** | **Transportation AI Agent & Integration** | Embed AI Agent chat UI; end-to-end UX polish | Full-system load testing, Dockerization, final integration | Run full simulation benchmarks for thesis evaluation (`BR-01`, `BR-04`) | Connect Agent to all tools; enforce safety & human-routing guardrails |

---

## 🔄 6. Scrum Workflow & Definition of Done (DoD)

### Ceremonies
1. **Sprint Planning (Every 2 Weeks):** Select prioritized backlog items (`High` $\rightarrow$ `Medium` $\rightarrow$ `Low`) and lock JSON API contracts between tracks.
2. **Daily Stand-up (10–15 mins):** Sync on progress, plans, and 48-hour blockers.
3. **Sprint Review (Bi-weekly with Prof. Saleh Mesbah):** Demo a working, integrated increment of both the Application and AI streams.
4. **Sprint Retrospective:** Inspect and adapt team velocity, data challenges, and integration workflows.

### Definition of Done (DoD)
A backlog item is considered **Done** only when:
- [ ] Code is implemented and follows agreed JSON/API schemas.
- [ ] Unit and integration tests pass on the shared branch.
- [ ] **For AI Models:** Evaluated on held-out test data and meets agreed target metrics (`BR-01` to `BR-06`).
- [ ] Merged into the main integration branch and demonstrable in the Sprint Review.
- [ ] Requirements traceability (`BR` $\rightarrow$ `UR` $\rightarrow$ `FR` $\rightarrow$ Module) is documented for the thesis report.

---

## 📂 7. Proposed Repository Structure

```text
nqla-platform/
├── apps/
│   ├── mobile_app/          # Track 1: Flutter Passenger & Driver App
│   └── admin_dashboard/     # Track 1: Flutter Web / Admin Interface
├── backend/
│   ├── app/                 # Track 2: FastAPI routers, WebSockets, Matching Engine
│   ├── db/                  # Track 2: PostGIS migrations & Alexandria route seed data
│   └── tests/
├── ai_services/
│   ├── demand_incentives/   # Track 3: Spatiotemporal forecasting & incentive optimization
│   ├── safety_scoring/      # Track 3: Driver safety score pipeline
│   ├── simulation/          # Track 3: Synthetic mobility & matching simulator
│   ├── egyptian_nlp/        # Track 4: Egyptian Arabic & Franco-Arabic classifiers
│   └── transport_agent/     # Track 4: Transportation AI Agent & tool definitions
├── docs/
│   ├── api_contracts/       # Shared JSON schemas per sprint
│   └── traceability/        # BR -> UR -> FR mapping & sprint evaluation logs
└── docker-compose.yml       # Local multi-container orchestration
```