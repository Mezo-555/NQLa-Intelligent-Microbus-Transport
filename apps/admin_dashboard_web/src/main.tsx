import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AdminLayout } from './layout/AdminLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DriversPage } from './features/drivers/DriversPage';
import { PassengersPage } from './features/passengers/PassengersPage';
import { RequestsPage } from './features/requests/RequestsPage';
import { TripsPage } from './features/trips/TripsPage';
import { RoutesPage } from './features/routes/RoutesPage';
import { ReportsPage } from './features/reports/ReportsPage';
import './styles.css';
import './features/ai/ai.css';
import './features/map/maplibre-map.css';
import './features/drivers/drivers-api.css';

const OperationsMapPage = lazy(() => import('./features/map/OperationsMapPage').then((module) => ({ default: module.OperationsMapPage })));
const AIInsightsPage = lazy(() => import('./features/ai/AIInsightsPage').then((module) => ({ default: module.AIInsightsPage })));
const deferred = (element: React.ReactNode) => <Suspense fallback={<div className="state-panel"><span className="spinner" /> جارٍ تحميل الوحدة…</div>}>{element}</Suspense>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'drivers', element: <DriversPage /> },
      { path: 'passengers', element: <PassengersPage /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'map', element: deferred(<OperationsMapPage />) },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'ai-insights', element: deferred(<AIInsightsPage />) },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>,
);
