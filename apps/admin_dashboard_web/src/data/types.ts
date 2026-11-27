export type DriverState = 'متاح' | 'في رحلة' | 'غير متصل' | 'موقوف';
export type AccountState = 'نشط' | 'مقيّد';
export type RequestState = 'جديد' | 'مُسند' | 'مكتمل' | 'ملغي';
export type TripState = 'مُسندة' | 'جارية' | 'مكتملة' | 'ملغاة';
export type RouteState = 'نشط' | 'موقوف';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  routeId: string;
  routeName: string;
  rating: number;
  completedTrips: number;
  state: DriverState;
  account: AccountState;
  lastSeen: string;
  mapX: number;
  mapY: number;
}

export interface Passenger {
  id: string;
  name: string;
  phone: string;
  joinedAt: string;
  rides: number;
  rating: number;
  account: AccountState;
  lastTrip: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  driverId: string | null;
  driverName: string | null;
  from: string;
  to: string;
  requestedAt: string;
  waitingMinutes: number;
  fare: number;
  status: RequestState;
}

export interface Trip {
  id: string;
  requestId?: string;
  driverId: string;
  driverName: string;
  passengerId: string;
  passengerName: string;
  routeName: string;
  from: string;
  to: string;
  startedAt: string;
  duration: string;
  fare: number;
  status: TripState;
}

export interface Station {
  id: string;
  name: string;
  mapX: number;
  mapY: number;
}

export interface TransitRoute {
  id: string;
  name: string;
  color: string;
  status: RouteState;
  driverCount: number;
  stations: Station[];
}

export interface DashboardStats {
  totalTrips: number;
  tripsToday: number;
  availableDrivers: number;
  activePassengers: number;
  openRequests: number;
  revenueToday: number;
  averageWaitMinutes: number;
  completionRate: number;
}

export interface TrendPoint {
  label: string;
  trips: number;
  requests: number;
  revenue: number;
}
