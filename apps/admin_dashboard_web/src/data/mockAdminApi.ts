import type {
  AccountState,
  DashboardStats,
  Driver,
  Passenger,
  RequestState,
  RideRequest,
  RouteState,
  TransitRoute,
  TrendPoint,
  Trip,
} from './types';

const initialDrivers: Driver[] = [
  { id: 'DR-1042', name: 'أحمد محمد', phone: '0101 234 5678', vehicle: 'ميكروباص تويوتا', plate: 'س أ ج ٤٢١٥', routeId: 'RT-01', routeName: 'سيدي جابر – المنشية', rating: 4.9, completedTrips: 684, state: 'متاح', account: 'نشط', lastSeen: 'منذ دقيقة', mapX: 18, mapY: 27 },
  { id: 'DR-1088', name: 'محمود إبراهيم', phone: '0112 345 6789', vehicle: 'ميكروباص هيونداي', plate: 'س ب د ٧٣٠٢', routeId: 'RT-02', routeName: 'سموحة – محطة الرمل', rating: 4.7, completedTrips: 512, state: 'في رحلة', account: 'نشط', lastSeen: 'الآن', mapX: 43, mapY: 37 },
  { id: 'DR-1103', name: 'مصطفى السيد', phone: '0122 456 7890', vehicle: 'ميكروباص شيفروليه', plate: 'س ج هـ ١٩٨٤', routeId: 'RT-03', routeName: 'العصافرة – المنشية', rating: 4.6, completedTrips: 428, state: 'متاح', account: 'نشط', lastSeen: 'منذ دقيقتين', mapX: 74, mapY: 24 },
  { id: 'DR-1117', name: 'خالد حسن', phone: '0109 222 3311', vehicle: 'ميكروباص تويوتا', plate: 'س د و ٥٥١٩', routeId: 'RT-04', routeName: 'العامرية – محرم بك', rating: 4.8, completedTrips: 392, state: 'غير متصل', account: 'نشط', lastSeen: 'منذ ٣ ساعات', mapX: 25, mapY: 72 },
  { id: 'DR-1134', name: 'إبراهيم علي', phone: '0155 773 0091', vehicle: 'ميكروباص كينج لونج', plate: 'س هـ ي ٦١٠٣', routeId: 'RT-01', routeName: 'سيدي جابر – المنشية', rating: 4.4, completedTrips: 301, state: 'في رحلة', account: 'نشط', lastSeen: 'الآن', mapX: 58, mapY: 62 },
  { id: 'DR-1179', name: 'عمرو عادل', phone: '0100 661 4273', vehicle: 'ميكروباص هيونداي', plate: 'س و ز ٢٨٧٦', routeId: 'RT-05', routeName: 'المندرة – سموحة', rating: 4.2, completedTrips: 218, state: 'موقوف', account: 'مقيّد', lastSeen: 'أمس', mapX: 83, mapY: 71 },
  { id: 'DR-1205', name: 'ياسر فتحي', phone: '0127 160 8421', vehicle: 'ميكروباص تويوتا', plate: 'س ح ط ٨٠٤١', routeId: 'RT-02', routeName: 'سموحة – محطة الرمل', rating: 4.9, completedTrips: 771, state: 'متاح', account: 'نشط', lastSeen: 'منذ ٤ دقائق', mapX: 36, mapY: 53 },
  { id: 'DR-1231', name: 'حسام الدين', phone: '0114 888 0520', vehicle: 'ميكروباص شيفروليه', plate: 'س خ ع ٣١٦٨', routeId: 'RT-03', routeName: 'العصافرة – المنشية', rating: 4.5, completedTrips: 177, state: 'غير متصل', account: 'نشط', lastSeen: 'منذ ٦ ساعات', mapX: 64, mapY: 82 },
  { id: 'DR-1297', name: 'زياد طارق', phone: '0128 524 1990', vehicle: 'ميكروباص تويوتا', plate: 'س ع ل ٩٠٤٧', routeId: 'RT-04', routeName: 'العامرية – محرم بك', rating: 4.8, completedTrips: 453, state: 'متاح', account: 'نشط', lastSeen: 'منذ ٥ دقائق', mapX: 29, mapY: 44 },
];

const initialPassengers: Passenger[] = [
  { id: 'PS-2001', name: 'سارة محمود', phone: '0109 100 2200', joinedAt: '١٢ أكتوبر ٢٠٢٦', rides: 42, rating: 4.9, account: 'نشط', lastTrip: 'اليوم · سموحة إلى جليم' },
  { id: 'PS-2045', name: 'عمر خالد', phone: '0111 337 4001', joinedAt: '٢٨ سبتمبر ٢٠٢٦', rides: 28, rating: 4.7, account: 'نشط', lastTrip: 'اليوم · سيدي جابر إلى المنشية' },
  { id: 'PS-2108', name: 'مريم علي', phone: '0120 445 8812', joinedAt: '١٦ سبتمبر ٢٠٢٦', rides: 17, rating: 5.0, account: 'نشط', lastTrip: 'أمس · محطة الرمل إلى سموحة' },
  { id: 'PS-2184', name: 'يوسف أحمد', phone: '0106 843 1957', joinedAt: '٣ سبتمبر ٢٠٢٦', rides: 63, rating: 4.8, account: 'نشط', lastTrip: 'اليوم · العصافرة إلى سيدي جابر' },
  { id: 'PS-2210', name: 'نورهان سمير', phone: '0155 312 6650', joinedAt: '٢٢ أغسطس ٢٠٢٦', rides: 9, rating: 4.2, account: 'نشط', lastTrip: 'منذ يومين · باكوس إلى الإبراهيمية' },
  { id: 'PS-2263', name: 'كريم حسن', phone: '0122 911 7300', joinedAt: '١١ أغسطس ٢٠٢٦', rides: 31, rating: 3.9, account: 'مقيّد', lastTrip: '٢٤ أكتوبر · محرم بك إلى المنشية' },
  { id: 'PS-2301', name: 'ملك إيهاب', phone: '0110 921 6634', joinedAt: '٢ أغسطس ٢٠٢٦', rides: 14, rating: 4.8, account: 'نشط', lastTrip: 'اليوم · جليم إلى سيدي جابر' },
  { id: 'PS-2380', name: 'عبد الرحمن وائل', phone: '0102 455 9003', joinedAt: '٢٦ يوليو ٢٠٢٦', rides: 5, rating: 4.1, account: 'نشط', lastTrip: 'منذ ٣ أيام · ميامي إلى سموحة' },
];

const initialRequests: RideRequest[] = [
  { id: 'RQ-5812', passengerId: 'PS-2001', passengerName: 'سارة محمود', driverId: null, driverName: null, from: 'سموحة · ميدان فيكتور عمانويل', to: 'جليم · شارع أبو قير', requestedAt: 'منذ دقيقة', waitingMinutes: 1, fare: 32, status: 'جديد' },
  { id: 'RQ-5811', passengerId: 'PS-2045', passengerName: 'عمر خالد', driverId: 'DR-1088', driverName: 'محمود إبراهيم', from: 'سيدي جابر · محطة القطار', to: 'المنشية · ميدان التحرير', requestedAt: 'منذ ٣ دقائق', waitingMinutes: 3, fare: 28, status: 'مُسند' },
  { id: 'RQ-5809', passengerId: 'PS-2184', passengerName: 'يوسف أحمد', driverId: null, driverName: null, from: 'العصافرة · شارع جمال عبد الناصر', to: 'سيدي جابر · شارع المشير', requestedAt: 'منذ ٥ دقائق', waitingMinutes: 5, fare: 41, status: 'جديد' },
  { id: 'RQ-5807', passengerId: 'PS-2108', passengerName: 'مريم علي', driverId: 'DR-1042', driverName: 'أحمد محمد', from: 'محطة الرمل · ميدان سعد زغلول', to: 'سموحة · نادي سموحة', requestedAt: 'منذ ١٢ دقيقة', waitingMinutes: 0, fare: 35, status: 'مكتمل' },
  { id: 'RQ-5802', passengerId: 'PS-2210', passengerName: 'نورهان سمير', driverId: null, driverName: null, from: 'باكوس · شارع مصطفى كامل', to: 'الإبراهيمية · شارع لاجتيه', requestedAt: 'منذ ٢١ دقيقة', waitingMinutes: 0, fare: 24, status: 'ملغي' },
  { id: 'RQ-5798', passengerId: 'PS-2301', passengerName: 'ملك إيهاب', driverId: 'DR-1134', driverName: 'إبراهيم علي', from: 'جليم · الكورنيش', to: 'سيدي جابر · محطة الترام', requestedAt: 'منذ ٢٧ دقيقة', waitingMinutes: 0, fare: 22, status: 'مُسند' },
  { id: 'RQ-5791', passengerId: 'PS-2380', passengerName: 'عبد الرحمن وائل', driverId: null, driverName: null, from: 'ميامي · شارع خالد بن الوليد', to: 'سموحة · شارع فوزي معاذ', requestedAt: 'منذ ٤٠ دقيقة', waitingMinutes: 14, fare: 46, status: 'جديد' },
];

const initialTrips: Trip[] = [
  { id: 'TR-9021', requestId: 'RQ-5807', driverId: 'DR-1042', driverName: 'أحمد محمد', passengerId: 'PS-2108', passengerName: 'مريم علي', routeName: 'سيدي جابر – المنشية', from: 'محطة الرمل', to: 'سموحة', startedAt: 'اليوم · ١٠:٤٢ ص', duration: '٢٣ دقيقة', fare: 35, status: 'مكتملة' },
  { id: 'TR-9020', requestId: 'RQ-5811', driverId: 'DR-1088', driverName: 'محمود إبراهيم', passengerId: 'PS-2045', passengerName: 'عمر خالد', routeName: 'سموحة – محطة الرمل', from: 'سيدي جابر', to: 'المنشية', startedAt: 'اليوم · ١٠:٣٦ ص', duration: '١٨ دقيقة', fare: 28, status: 'مُسندة' },
  { id: 'TR-9019', requestId: 'RQ-5798', driverId: 'DR-1134', driverName: 'إبراهيم علي', passengerId: 'PS-2301', passengerName: 'ملك إيهاب', routeName: 'سيدي جابر – المنشية', from: 'جليم', to: 'سيدي جابر', startedAt: 'اليوم · ١٠:١٨ ص', duration: '٢١ دقيقة', fare: 22, status: 'مُسندة' },
  { id: 'TR-9018', driverId: 'DR-1205', driverName: 'ياسر فتحي', passengerId: 'PS-2001', passengerName: 'سارة محمود', routeName: 'سموحة – محطة الرمل', from: 'سموحة', to: 'جليم', startedAt: 'اليوم · ٩:٥٨ ص', duration: '٢٧ دقيقة', fare: 32, status: 'مكتملة' },
  { id: 'TR-9017', driverId: 'DR-1297', driverName: 'زياد طارق', passengerId: 'PS-2184', passengerName: 'يوسف أحمد', routeName: 'العامرية – محرم بك', from: 'العامرية', to: 'محرم بك', startedAt: 'اليوم · ٩:٤٤ ص', duration: '٣٤ دقيقة', fare: 41, status: 'مكتملة' },
  { id: 'TR-9016', requestId: 'RQ-5802', driverId: 'DR-1117', driverName: 'خالد حسن', passengerId: 'PS-2210', passengerName: 'نورهان سمير', routeName: 'العصافرة – المنشية', from: 'باكوس', to: 'الإبراهيمية', startedAt: 'اليوم · ٩:١٣ ص', duration: '١٩ دقيقة', fare: 24, status: 'ملغاة' },
  { id: 'TR-9015', driverId: 'DR-1042', driverName: 'أحمد محمد', passengerId: 'PS-2380', passengerName: 'عبد الرحمن وائل', routeName: 'سيدي جابر – المنشية', from: 'المنشية', to: 'محطة الرمل', startedAt: 'اليوم · ٨:٥٠ ص', duration: '١٦ دقيقة', fare: 20, status: 'مكتملة' },
];

const initialRoutes: TransitRoute[] = [
  { id: 'RT-01', name: 'سيدي جابر – المنشية', color: '#0d8587', status: 'نشط', driverCount: 18, stations: [{ id: 'ST-01', name: 'محطة سيدي جابر', mapX: 20, mapY: 28 }, { id: 'ST-02', name: 'سبورتنج', mapX: 34, mapY: 36 }, { id: 'ST-03', name: 'جليم', mapX: 48, mapY: 45 }, { id: 'ST-04', name: 'محطة الرمل', mapX: 65, mapY: 53 }, { id: 'ST-05', name: 'المنشية', mapX: 81, mapY: 59 }] },
  { id: 'RT-02', name: 'سموحة – محطة الرمل', color: '#5073d5', status: 'نشط', driverCount: 14, stations: [{ id: 'ST-06', name: 'ميدان فيكتور عمانويل', mapX: 42, mapY: 61 }, { id: 'ST-07', name: 'شارع فوزي معاذ', mapX: 52, mapY: 58 }, { id: 'ST-08', name: 'الإبراهيمية', mapX: 61, mapY: 56 }, { id: 'ST-09', name: 'محطة الرمل', mapX: 69, mapY: 53 }] },
  { id: 'RT-03', name: 'العصافرة – المنشية', color: '#eb9a37', status: 'نشط', driverCount: 21, stations: [{ id: 'ST-10', name: 'العصافرة', mapX: 84, mapY: 19 }, { id: 'ST-11', name: 'ميامي', mapX: 75, mapY: 27 }, { id: 'ST-12', name: 'سيدي جابر', mapX: 59, mapY: 38 }, { id: 'ST-13', name: 'المنشية', mapX: 30, mapY: 57 }] },
  { id: 'RT-04', name: 'العامرية – محرم بك', color: '#9361c9', status: 'نشط', driverCount: 12, stations: [{ id: 'ST-14', name: 'العامرية', mapX: 15, mapY: 77 }, { id: 'ST-15', name: 'الكافوري', mapX: 31, mapY: 67 }, { id: 'ST-16', name: 'محرم بك', mapX: 49, mapY: 59 }, { id: 'ST-17', name: 'المنشية', mapX: 69, mapY: 51 }] },
  { id: 'RT-05', name: 'المندرة – سموحة', color: '#de6b82', status: 'موقوف', driverCount: 7, stations: [{ id: 'ST-18', name: 'المندرة', mapX: 89, mapY: 23 }, { id: 'ST-19', name: 'ميامي', mapX: 78, mapY: 32 }, { id: 'ST-20', name: 'ستانلي', mapX: 61, mapY: 43 }, { id: 'ST-21', name: 'سموحة', mapX: 43, mapY: 59 }] },
];

const clone = <T,>(value: T): T => structuredClone(value);
let failNextRead = false;
export function simulateNextReadError() { failNextRead = true; }
const wait = <T,>(value: T, ms = 280): Promise<T> => new Promise((resolve, reject) => setTimeout(() => {
  if (failNextRead) { failNextRead = false; reject(new Error('خطأ تجريبي: تعذر الاتصال بالخدمة المحلية.')); return; }
  resolve(clone(value));
}, ms));
let drivers = clone(initialDrivers);
let passengers = clone(initialPassengers);
let requests = clone(initialRequests);
let trips = clone(initialTrips);
let routes = clone(initialRoutes);
const trend: TrendPoint[] = [
  { label: 'السبت', trips: 184, requests: 206, revenue: 6240 }, { label: 'الأحد', trips: 212, requests: 239, revenue: 7180 }, { label: 'الإثنين', trips: 198, requests: 220, revenue: 6810 }, { label: 'الثلاثاء', trips: 246, requests: 279, revenue: 8420 }, { label: 'الأربعاء', trips: 231, requests: 264, revenue: 7960 }, { label: 'الخميس', trips: 287, requests: 321, revenue: 9710 }, { label: 'الجمعة', trips: 263, requests: 300, revenue: 9130 },
];

export const mockAdminApi = {
  async getDashboard(): Promise<DashboardStats> {
    const completed = trips.filter((trip) => trip.status === 'مكتملة');
    const todayTrips = trips.filter((trip) => trip.startedAt.includes('اليوم'));
    const waiting = requests.filter((request) => request.status === 'جديد');
    const averageWaitMinutes = waiting.length ? Math.round(waiting.reduce((sum, request) => sum + request.waitingMinutes, 0) / waiting.length) : 0;
    return wait({ totalTrips: trips.length, tripsToday: todayTrips.length, availableDrivers: drivers.filter((driver) => driver.state === 'متاح').length, activePassengers: passengers.filter((passenger) => passenger.account === 'نشط').length, openRequests: requests.filter((request) => request.status === 'جديد' || request.status === 'مُسند').length, revenueToday: completed.filter((trip) => trip.startedAt.includes('اليوم')).reduce((sum, trip) => sum + trip.fare, 0), averageWaitMinutes, completionRate: todayTrips.length ? Math.round(completed.filter((trip) => trip.startedAt.includes('اليوم')).length / todayTrips.length * 100) : 0 });
  },
  async getDrivers(): Promise<Driver[]> { return wait(drivers); },
  async getPassengers(): Promise<Passenger[]> { return wait(passengers); },
  async getRequests(): Promise<RideRequest[]> { return wait(requests); },
  async getTrips(): Promise<Trip[]> { return wait(trips); },
  async getRoutes(): Promise<TransitRoute[]> { return wait(routes); },
  async getTrend(): Promise<TrendPoint[]> { return wait(trend); },
  async getMapSnapshot() { return wait({ drivers, requests: requests.filter((item) => item.status === 'جديد' || item.status === 'مُسند'), routes, trips: trips.filter((item) => item.status === 'مُسندة' || item.status === 'جارية') }); },
  async getPassengerTrips(passengerId: string): Promise<Trip[]> { return wait(trips.filter((trip) => trip.passengerId === passengerId)); },
  async setDriverAccount(id: string, account: AccountState): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 240));
    drivers = drivers.map((driver) => driver.id === id ? { ...driver, account, state: account === 'مقيّد' ? 'موقوف' : driver.state === 'موقوف' ? 'غير متصل' : driver.state } : driver);
  },
  async setPassengerAccount(id: string, account: AccountState): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 240));
    passengers = passengers.map((passenger) => passenger.id === id ? { ...passenger, account } : passenger);
  },
  async setRequestStatus(id: string, status: RequestState): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 320));
    const request = requests.find((item) => item.id === id);
    if (!request) throw new Error('الطلب غير موجود في البيانات التجريبية.');
    if (request.status === status) return;
    if (request.status === 'مكتمل' || request.status === 'ملغي') throw new Error('لا يمكن تغيير حالة طلب نهائي.');
    if (status === 'مكتمل' && request.status !== 'مُسند') throw new Error('يجب إسناد الطلب قبل إكماله.');
    if (status === 'مُسند' && request.status !== 'جديد') throw new Error('لا يمكن إسناد الطلب إلا إذا كان جديدًا.');
    let driverId = request.driverId;
    let driverName = request.driverName;
    if (status === 'مُسند') {
      const driver = drivers.find((item) => item.account === 'نشط' && item.state === 'متاح');
      if (!driver) throw new Error('لا يوجد سائق متاح لإسناد الطلب التجريبي.');
      driverId = driver.id;
      driverName = driver.name;
      drivers = drivers.map((item) => item.id === driver!.id ? { ...item, state: 'في رحلة' } : item);
      const routeName = routes.find((route) => route.id === driver!.routeId)?.name ?? driver.routeName;
      trips = [{ id: `TR-${9022 + trips.length}`, requestId: request.id, driverId: driver.id, driverName: driver.name, passengerId: request.passengerId, passengerName: request.passengerName, routeName, from: request.from, to: request.to, startedAt: 'الآن · إسناد تجريبي', duration: '—', fare: request.fare, status: 'مُسندة' }, ...trips];
    }
    if (status === 'مكتمل' || status === 'ملغي') {
      trips = trips.map((trip) => trip.requestId === request.id ? { ...trip, status: status === 'مكتمل' ? 'مكتملة' : 'ملغاة' } : trip);
      if (request.driverId) drivers = drivers.map((driver) => driver.id === request.driverId && driver.state === 'في رحلة' ? { ...driver, state: 'متاح' } : driver);
    }
    requests = requests.map((item) => item.id === id ? { ...item, status, driverId: status === 'ملغي' ? null : driverId, driverName: status === 'ملغي' ? null : driverName } : item);
  },
  async setTripStatus(id: string, status: Trip['status']): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 260));
    const current = trips.find((trip) => trip.id === id);
    if (!current) throw new Error('الرحلة غير موجودة في البيانات التجريبية.');
    if (current.status !== 'مُسندة' && current.status !== 'جارية') throw new Error('يمكن تغيير حالة الرحلة النشطة فقط.');
    if (status !== 'مكتملة' && status !== 'ملغاة') throw new Error('الحالة الجديدة غير صالحة.');
    trips = trips.map((trip) => trip.id === id ? { ...trip, status } : trip);
    drivers = drivers.map((driver) => driver.id === current.driverId && driver.state === 'في رحلة' ? { ...driver, state: 'متاح' } : driver);
    if (current.requestId) requests = requests.map((request) => request.id === current.requestId ? { ...request, status: status === 'مكتملة' ? 'مكتمل' : 'ملغي', driverId: status === 'ملغاة' ? null : request.driverId, driverName: status === 'ملغاة' ? null : request.driverName } : request);
  },
  async setRouteStatus(id: string, status: RouteState): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 220));
    routes = routes.map((route) => route.id === id ? { ...route, status } : route);
  },
  async addDemoRequest(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 280));
    const next = 5813 + requests.length;
    requests = [{ id: `RQ-${next}`, passengerId: 'PS-2001', passengerName: 'سارة محمود', driverId: null, driverName: null, from: 'جليم · شارع أبو قير', to: 'سموحة · ميدان فيكتور عمانويل', requestedAt: 'الآن', waitingMinutes: 0, fare: 30 + (next % 16), status: 'جديد' }, ...requests];
  },
  async addDemoRoute(name: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const id = `RT-${String(routes.length + 1).padStart(2, '0')}`;
    routes = [...routes, { id, name, color: '#0d8587', status: 'نشط', driverCount: 0, stations: [{ id: `${id}-01`, name: 'محطة البداية', mapX: 24, mapY: 36 }, { id: `${id}-02`, name: 'محطة وسطى', mapX: 50, mapY: 50 }, { id: `${id}-03`, name: 'محطة النهاية', mapX: 77, mapY: 64 }] }];
  },
  async addDemoStation(routeId: string, name: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 240));
    const route = routes.find((item) => item.id === routeId);
    const cleanName = name.trim();
    if (!route) throw new Error('المسار غير موجود في العينة.');
    if (!cleanName) throw new Error('اكتب اسم المحطة أولًا.');
    const previous = route.stations[route.stations.length - 1];
    const index = route.stations.length + 1;
    const station = { id: `${routeId}-S${String(index).padStart(2, '0')}`, name: cleanName, mapX: Math.min(90, (previous?.mapX ?? 24) + 8), mapY: Math.min(84, (previous?.mapY ?? 36) + (index % 2 ? 4 : -4)) };
    routes = routes.map((item) => item.id === routeId ? { ...item, stations: [...item.stations, station] } : item);
  },
  async removeDemoStation(routeId: string, stationId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const route = routes.find((item) => item.id === routeId);
    if (!route) throw new Error('المسار غير موجود في العينة.');
    if (route.stations.length <= 2) throw new Error('يجب أن يحتوي المسار على محطتي بداية ونهاية على الأقل.');
    routes = routes.map((item) => item.id === routeId ? { ...item, stations: item.stations.filter((station) => station.id !== stationId) } : item);
  },
};

export function getDriverStateCounts(items: Driver[]) {
  return { available: items.filter((item) => item.state === 'متاح').length, onTrip: items.filter((item) => item.state === 'في رحلة').length, offline: items.filter((item) => item.state === 'غير متصل').length, suspended: items.filter((item) => item.state === 'موقوف').length };
}
