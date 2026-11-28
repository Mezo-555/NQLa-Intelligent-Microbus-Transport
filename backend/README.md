# NQLa Backend

FastAPI service foundation for authentication, driver status/location, route planning, and initial ride matching. It is intentionally separate from the Flutter applications under `apps/`.

## Local development

From the repository root, copy `.env.example` to `.env` and replace `JWT_SECRET_KEY` with a unique random secret of at least 32 characters. The sample PostgreSQL credentials are only for a local development database; never use them outside a local environment.

Start PostGIS and the API:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose applies the Alembic migrations before starting the API. Open Swagger UI at `http://localhost:8000/docs`; API routes use `/api/v1`. Health endpoints are `/health` and `/health/db`.

To run database commands manually:

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
```

For running the Python suite on the host, from the repository root:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Set-Location backend
python -m pytest tests -q
ruff check .
```

## PostGIS integration tests

The integration suite uses a separate PostgreSQL/PostGIS container on port `5433`; it never uses the development database. Docker must be running first.

```powershell
docker compose --profile integration up --build integration-tests
docker compose --profile integration down
```

The integration-test container applies Alembic migrations, runs `tests/test_integration_postgis.py`, and exits. A persistent test volume is created as `nqla_postgres_test_data`; remove it only when a fully clean test database is needed:

```powershell
docker compose --profile integration down -v
```

The test suite is designed to exercise routing, scoring, geospatial calculations, schemas, and API validation without connecting to a non-test database. To run locally against PostgreSQL, set `DATABASE_URL` to a test-only PostGIS database before running database integration tests.

## API foundation

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a client or driver |
| `POST` | `/api/v1/auth/login` | OAuth2 password-form login; returns a bearer JWT |
| `GET` | `/api/v1/auth/me` | Return the authenticated account |
| `POST` | `/api/v1/drivers/me/location` | Persist a driver's validated GPS point |
| `PUT` | `/api/v1/drivers/me/availability` | Set driver to `offline`, `available`, or `busy` |
| `GET` | `/api/v1/drivers/me/status` | Read driver availability and latest location freshness |
| `GET` | `/api/v1/drivers/me/matches` | List this driver's open ride offers |
| `GET` | `/api/v1/drivers/nearby` | Admin-only PostGIS search for available, recently seen drivers |
| `POST` | `/api/v1/routes/search` | Search journeys on the explicitly synthetic network |
| `POST` | `/api/v1/rides` | Create a client ride request |
| `POST` | `/api/v1/rides/{id}/matches` | Rank and persist eligible nearby driver candidates |
| `GET` | `/api/v1/rides/{id}` | Read the caller's ride status |
| `POST` | `/api/v1/rides/{id}/matches/{match_id}/decision` | Driver accepts or rejects an offered match |

Drivers need a fresh location before they can be considered for matches. Driver location updates and match requests are REST-based; WebSockets are intentionally deferred.

## Data and future GTFS integration

The route planner currently uses `SyntheticTransitNetwork`: generic stops and lines are marked `synthetic_mock` in API responses and do not describe Alexandria transit. A best-first graph search minimizes ride minutes plus a fixed transfer wait, avoids repeated stops, limits transfers, and returns multiple alternatives. The response's walking distance is zero until a provider supplies transfer-walk data. The provider protocol can be replaced by a database/GTFS provider without changing the graph search algorithm. No synthetic network data is inserted into the production database.

`ENVIRONMENT` defaults to `development`; only `development` and `test` enable the synthetic route network and mock route-compatibility matcher. In `production`, journey search reports that no transit provider is configured, and matching stays unavailable until a verified compatibility provider is wired in.

PostgreSQL/PostGIS models include driver points (geography, SRID 4326), stop points, route geometries, ordered route-stop membership, and GiST spatial indexes. They carry a data-source marker to distinguish future GTFS imports from manually maintained and synthetic records. A future GTFS increment still needs feed import/validation, trips, stop times, service calendars, and schedules; none are fabricated here.

Matching weights, freshness window, search radius, and assumed average pickup speed are environment-configurable. ETA and route compatibility are approximate/mock until traffic and verified route assignments exist. The mock compatibility provider does not assert that a real driver serves any route.
