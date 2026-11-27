import { mockAdminApi } from './mockAdminApi';
import type { Driver, DriverState } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';
export const isAdminApiConfigured = API_BASE.length > 0;

type ApiDriver = {
  id?: string | number;
  name?: string | null;
  phone?: string | null;
  vehicle?: string | null;
  plate?: string | null;
  routeId?: string | null;
  routeName?: string | null;
  rating?: number | string | null;
  completedTrips?: number | string | null;
  state?: string | null;
  account?: string | null;
  lastSeen?: string | null;
};

function asRecord(value: unknown): ApiDriver {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ApiDriver;
}

function normalizeState(value: string | null | undefined): DriverState {
  if (value === 'في رحلة' || value === 'on_trip' || value === 'in_trip') return 'في رحلة';
  if (value === 'غير متصل' || value === 'offline') return 'غير متصل';
  if (value === 'موقوف' || value === 'suspended') return 'موقوف';
  return 'متاح';
}

function finiteNumber(value: number | string | null | undefined, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeDriver(record: ApiDriver, index: number): Driver {
  return {
    id: String(record.id ?? `API-${index + 1}`),
    name: String(record.name ?? 'سائق بلا اسم'),
    phone: String(record.phone ?? 'غير متاح'),
    vehicle: String(record.vehicle ?? 'غير محدد من API التدريب'),
    plate: String(record.plate ?? 'غير متاح من API التدريب'),
    routeId: String(record.routeId ?? 'API-TRAINING'),
    routeName: String(record.routeName ?? 'غير محدد من API التدريب'),
    rating: finiteNumber(record.rating, 0),
    completedTrips: finiteNumber(record.completedTrips, 0),
    state: normalizeState(record.state),
    account: record.account === 'مقيّد' || record.account === 'restricted' ? 'مقيّد' : 'نشط',
    lastSeen: String(record.lastSeen ?? 'غير متاح من API التدريب'),
    // إحداثيات العرض فقط: لا يستنتجها عميل HTTP من سجل السائق.
    mapX: 18 + ((index * 17) % 68),
    mapY: 24 + ((index * 13) % 54),
  };
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) return String(payload.error);
  if (payload && typeof payload === 'object' && 'message' in payload) return String(payload.message);
  return `فشل طلب السائقين من API (HTTP ${status}).`;
}

/**
 * عند ضبط VITE_API_BASE_URL=http://localhost:5000/api يقرأ من
 * GET {base}/admin/drivers. الAPI التدريبي الحالي لا يوفّر تحديثًا للحساب.
 */
export async function fetchApiDrivers(): Promise<Driver[]> {
  if (!isAdminApiConfigured) return mockAdminApi.getDrivers();

  const response = await fetch(`${API_BASE}/admin/drivers`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text) as unknown; }
    catch { payload = text; }
  }
  if (!response.ok) throw new Error(errorMessage(payload, response.status));

  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)
      ? payload.data
      : null;
  if (!rows) throw new Error('استجابة API غير متوافقة: المتوقع مصفوفة سائقين أو كائن يحتوي data.');
  return rows.map((row, index) => normalizeDriver(asRecord(row), index));
}
