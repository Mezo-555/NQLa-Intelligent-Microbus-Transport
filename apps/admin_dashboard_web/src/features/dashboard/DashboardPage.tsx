import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowUpLeft, BusFront, CircleDollarSign, Clock3, MapPin, Navigation, Route, Users, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mockAdminApi, getDriverStateCounts } from '../../data/mockAdminApi';
import type { DashboardStats, Driver, RideRequest, TrendPoint, Trip } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { DataTable, PageHeading, StatusBadge, type Column } from '../../components/ui';
import { MetricCard } from '../../components/MetricCard';

interface DashboardData { stats: DashboardStats; trend: TrendPoint[]; drivers: Driver[]; requests: RideRequest[]; trips: Trip[]; }

export function DashboardPage() {
  const loadDashboard = useCallback(async (): Promise<DashboardData> => {
    const [stats, trend, drivers, requests, trips] = await Promise.all([
      mockAdminApi.getDashboard(), mockAdminApi.getTrend(), mockAdminApi.getDrivers(), mockAdminApi.getRequests(), mockAdminApi.getTrips(),
    ]);
    return { stats, trend, drivers, requests, trips };
  }, []);
  const { data, loading, error, reload } = useMockResource(loadDashboard);
  const counts = data ? getDriverStateCounts(data.drivers) : { available: 0, onTrip: 0, offline: 0, suspended: 0 };
  const trips = (data?.trips ?? []).slice(0, 5);
  const activeTrips = data?.trips.filter((trip) => trip.status === 'مُسندة' || trip.status === 'جارية').length ?? 0;
  const newRequests = data?.requests.filter((request) => request.status === 'جديد').length ?? 0;
  const connectedDrivers = counts.available + counts.onTrip;
  const tripColumns: Column<Trip>[] = [
    { title: 'رقم الرحلة', key: 'id', render: (trip) => <span className="id-cell">{trip.id}</span> },
    { title: 'السائق والراكب', key: 'people', render: (trip) => <div className="two-line-cell"><b>{trip.driverName}</b><small>{trip.passengerName}</small></div> },
    { title: 'المسار', key: 'route', render: (trip) => <span className="muted-cell">{trip.from} <ArrowLeft size={12} /> {trip.to}</span> },
    { title: 'التكلفة', key: 'fare', render: (trip) => <b>{trip.fare} ج.م</b> },
    { title: 'الحالة', key: 'status', render: (trip) => <StatusBadge value={trip.status} /> },
  ];

  return <>
    <PageHeading title="مركز التشغيل" subtitle="نظرة تشغيلية واحدة على حركة NQLa في الإسكندرية." icon={<Zap size={16} />} actions={<button className="button button-secondary" onClick={reload}><Clock3 size={16} /> إعادة تحميل العينة</button>} />
    {error && <div className="inline-error"><span>{error}</span><button onClick={reload}>إعادة المحاولة</button></div>}

    <section className="ops-hero" aria-label="ملخص حركة النقل في الإسكندرية">
      <div className="ops-hero-copy">
        <div className="ops-hero-kicker"><span className="ops-live-dot" /> غرفة عمليات الإسكندرية <i>·</i> عرض تجريبي</div>
        <h2>كل حركة،<br /><em>أوضح بلمحة.</em></h2>
        <p>تابع السائقين والطلبات والرحلات من نقطة قيادة واحدة، واتخذ خطوتك التالية بسرعة.</p>
        <div className="ops-hero-actions"><Link className="ops-hero-primary" to="/map"><Navigation size={16} /> افتح الخريطة التشغيلية <ArrowLeft size={15} /></Link><Link className="ops-hero-secondary" to="/requests">راجع الطلبات <span>{loading ? '—' : newRequests.toLocaleString('ar-EG')}</span></Link></div>
        <div className="ops-hero-stats">
          <div><b>{loading ? '—' : connectedDrivers.toLocaleString('ar-EG')}</b><small><i className="hero-stat-green" /> سائق متصل</small></div>
          <div><b>{loading ? '—' : activeTrips.toLocaleString('ar-EG')}</b><small><i className="hero-stat-teal" /> رحلة نشطة</small></div>
          <div><b>{loading ? '—' : newRequests.toLocaleString('ar-EG')}</b><small><i className="hero-stat-amber" /> طلب جديد</small></div>
        </div>
      </div>
      <div className="ops-hero-art" aria-hidden="true">
        <div className="hero-art-topline"><span><Activity size={13} /> نبض التشغيل</span><b><i /> DEMO</b></div>
        <div className="hero-map-screen">
          <svg viewBox="0 0 460 250" preserveAspectRatio="xMidYMid meet">
            <path className="hero-map-road" d="M-20 57 C70 25 104 99 174 71 S289 24 352 67 427 103 488 62" />
            <path className="hero-map-road" d="M-20 146 C44 111 104 158 165 132 S282 101 332 143 420 178 490 129" />
            <path className="hero-map-road" d="M88 -18 C121 43 81 89 116 132 S152 203 128 270" />
            <path className="hero-map-road" d="M284 -18 C250 36 306 84 274 129 S244 201 294 270" />
            <path className="hero-map-route" d="M72 177 C121 154 155 96 209 116 S289 185 344 124 395 72 427 86" />
            <circle className="hero-map-stop" cx="72" cy="177" r="7" /><circle className="hero-map-stop" cx="209" cy="116" r="7" /><circle className="hero-map-stop" cx="344" cy="124" r="7" />
            <circle className="hero-map-bus-halo" cx="344" cy="124" r="17" /><circle className="hero-map-bus" cx="344" cy="124" r="7" />
          </svg>
          <span className="hero-map-label hero-map-label-a">سيدي جابر</span><span className="hero-map-label hero-map-label-b">محطة الرمل</span>
          <div className="hero-trip-card"><span className="hero-trip-icon"><BusFront size={17} /></span><span><small>رحلات مُسندة أو جارية</small><b>{loading ? '—' : activeTrips.toLocaleString('ar-EG')}</b></span><i className="hero-trip-arrow"><ArrowUpLeft size={13} /></i></div>
          <span className="hero-map-footnote">رسم تخطيطي للعرض · ليس خريطة أو GPS حيًا</span>
        </div>
        <div className="hero-art-glow" />
      </div>
    </section>

    <div className="metric-grid">
      <MetricCard title="رحلات اليوم" value={loading ? '—' : data!.stats.tripsToday.toLocaleString('ar-EG')} note="من سجلات العينة" icon={<Route size={20} />} accent="teal" />
      <MetricCard title="السائقون المتاحون" value={loading ? '—' : String(counts.available).padStart(2, '0')} note={`${counts.onTrip} في رحلة الآن`} icon={<BusFront size={20} />} accent="blue" />
      <MetricCard title="الطلبات المفتوحة" value={loading ? '—' : String(data!.stats.openRequests).padStart(2, '0')} note="تحتاج متابعة المشرف" icon={<MapPin size={20} />} accent="amber" />
      <MetricCard title="إيراد اليوم" value={loading ? '—' : `${data!.stats.revenueToday.toLocaleString('ar-EG')} ج.م`} note={`معدل الإكمال ${data?.stats.completionRate ?? '—'}٪`} icon={<CircleDollarSign size={20} />} accent="violet" />
    </div>

    <div className="dashboard-grid dashboard-main-grid">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><span className="panel-kicker">إيقاع الأسبوع</span><h2>حركة الرحلات والطلبات</h2></div><span className="chart-period chart-demo-pill">اتجاه اصطناعي للتوضيح <Clock3 size={13} /></span></div>
        <div className="chart-legend"><span><i className="legend-dot teal-dot" />الرحلات</span><span><i className="legend-dot pale-dot" />الطلبات</span></div>
        <div className="chart-area">
          {loading ? <div className="chart-loading"><span /><span /><span /><span /><span /><span /><span /></div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs><linearGradient id="tripFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d8587" stopOpacity={0.19} /><stop offset="95%" stopColor="#0d8587" stopOpacity={0.01} /></linearGradient><linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9ed8d5" stopOpacity={0.26} /><stop offset="95%" stopColor="#9ed8d5" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#edf1f4" strokeDasharray="3 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82909b', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#82909b', fontSize: 10 }} /><Tooltip contentStyle={{ border: '1px solid #e7edf0', borderRadius: 12, direction: 'rtl', fontFamily: 'inherit', fontSize: 12 }} />
            <Area type="monotone" dataKey="requests" name="الطلبات" stroke="#aadbd8" strokeWidth={2} fill="url(#requestFill)" /><Area type="monotone" dataKey="trips" name="الرحلات" stroke="#0d8587" strokeWidth={3} fill="url(#tripFill)" activeDot={{ r: 5, fill: '#0d8587', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart></ResponsiveContainer>}
        </div>
      </section>
      <section className="panel fleet-panel">
        <div className="panel-heading"><div><span className="panel-kicker">حالة الأسطول</span><h2>توزيع السائقين</h2></div><span className="fleet-total">{data?.drivers.length ?? '—'} سائق</span></div>
        <div className="fleet-summary"><div className="fleet-donut"><div><strong>{counts.available + counts.onTrip}</strong><small>متصل الآن</small></div></div><div className="fleet-list"><div><i className="dot-green" /><span>متاح</span><b>{counts.available}</b></div><div><i className="dot-teal" /><span>في رحلة</span><b>{counts.onTrip}</b></div><div><i className="dot-gray" /><span>غير متصل</span><b>{counts.offline}</b></div><div><i className="dot-red" /><span>موقوف</span><b>{counts.suspended}</b></div></div></div>
        <div className="fleet-footer"><span><Users size={15} /> متوسط الانتظار</span><b>{data?.stats.averageWaitMinutes ?? '—'} دقائق</b><ArrowUpLeft size={15} className="trend-up" /></div>
      </section>
    </div>

    <div className="section-row"><div><span className="panel-kicker">من بيانات العينة</span><h2>أحدث الرحلات</h2></div><Link className="text-link" to="/trips">كل الرحلات <ArrowLeft size={14} /></Link></div>
    <DataTable rows={trips} columns={tripColumns} loading={loading} error={error} onRetry={reload} emptyTitle="لا توجد رحلات حديثة" />

    <div className="dashboard-bottom-grid">
      <section className="panel request-preview"><div className="panel-heading"><div><span className="panel-kicker">بحاجة لمتابعة</span><h2>طلبات جديدة</h2></div><span className="count-pill">{data?.requests.filter((item) => item.status === 'جديد').length ?? '—'}</span></div>
        {(data?.requests.filter((item) => item.status === 'جديد').slice(0, 3) ?? []).map((request) => <div className="request-preview-row" key={request.id}><span className="request-pin"><MapPin size={16} /></span><div><b>{request.from.split('·')[0].trim()} <ArrowLeft size={12} /> {request.to.split('·')[0].trim()}</b><small>{request.passengerName} · {request.requestedAt}</small></div><strong>{request.fare} ج.م</strong></div>)}
        <Link className="request-footer-link" to="/requests">إدارة الطلبات <ArrowLeft size={14} /></Link>
      </section>
      <section className="panel area-preview"><div className="panel-heading"><div><span className="panel-kicker">توزيع جغرافي</span><h2>المناطق النشطة</h2></div><MapPin size={18} className="muted-icon" /></div><div className="area-bars"><div><span>شرق الإسكندرية</span><div className="area-track"><i style={{ width: '82%' }} /></div><b>٣٨٪</b></div><div><span>وسط المدينة</span><div className="area-track"><i style={{ width: '67%' }} /></div><b>٢٧٪</b></div><div><span>سموحة وسيدي جابر</span><div className="area-track"><i style={{ width: '54%' }} /></div><b>٢١٪</b></div><div><span>غرب الإسكندرية</span><div className="area-track"><i style={{ width: '35%' }} /></div><b>١٤٪</b></div></div><div className="area-preview-foot"><span>بيانات المناطق تجريبية</span><Link className="text-link" to="/map">افتح الخريطة <ArrowLeft size={13} /></Link></div></section>
    </div>
  </>;
}
