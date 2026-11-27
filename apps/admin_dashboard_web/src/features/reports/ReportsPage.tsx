import { useCallback, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarDays, Download, TrendingUp } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { Driver, RideRequest, TrendPoint, Trip, TransitRoute } from '../../data/types';
import type { AIAdminSnapshot } from '../../data/aiTypes';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';
import { useMockResource } from '../../hooks/useMockResource';
import { MetricCard } from '../../components/MetricCard';
import { PageHeading, StatusBadge, type Column, DataTable } from '../../components/ui';
import './ai-report.css';

interface ReportData { trend: TrendPoint[]; drivers: Driver[]; requests: RideRequest[]; trips: Trip[]; routes: TransitRoute[]; ai: AIAdminSnapshot; }
const COLORS = ['#0d8587', '#3f73cf', '#e7aa49', '#a0adb7'];

export function ReportsPage() {
  const loader = useCallback(async (): Promise<ReportData> => {
    const [trend, drivers, requests, trips, routes, ai] = await Promise.all([mockAdminApi.getTrend(), mockAdminApi.getDrivers(), mockAdminApi.getRequests(), mockAdminApi.getTrips(), mockAdminApi.getRoutes(), mockAiAdminApi.getSnapshot()]);
    return { trend, drivers, requests, trips, routes, ai };
  }, []);
  const { data, loading, error, reload } = useMockResource(loader);
  const driverStates = useMemo(() => {
    const source = data?.drivers ?? [];
    return ['متاح', 'في رحلة', 'غير متصل', 'موقوف'].map((name) => ({ name, value: source.filter((driver) => driver.state === name).length }));
  }, [data]);
  const routeRows = (data?.routes ?? []).map((route) => {
    const routeTrips = (data?.trips ?? []).filter((trip) => trip.routeName === route.name);
    return { id: route.id, name: route.name, trips: routeTrips.length, revenue: routeTrips.filter((trip) => trip.status === 'مكتملة').reduce((sum, trip) => sum + trip.fare, 0), status: route.status };
  });
  const routeColumns: Column<(typeof routeRows)[number]>[] = [
    { title: 'المسار', key: 'name', render: (row) => <span className="person-cell"><i className="route-color-dot" /><b>{row.name}</b></span> },
    { title: 'الرحلات', key: 'trips', render: (row) => <b>{row.trips.toLocaleString('ar-EG')}</b> },
    { title: 'أجور الرحلات المكتملة', key: 'revenue', render: (row) => <b>{row.revenue.toLocaleString('ar-EG')} ج.م</b> },
    { title: 'الحالة', key: 'status', render: (row) => <StatusBadge value={row.status} /> },
  ];
  const aiReportRows = [
    { topic: 'الطلب وفجوة المقاعد', records: data?.ai.forecasts.length ?? null, note: 'DEMO فقط — لا يوجد موديل تنبؤ متصل' },
    { topic: 'توصيات الحوافز والردود', records: data?.ai.recommendations.length ?? null, note: 'عينة محلية — لا تُرسل للسائقين' },
    { topic: 'ملاحظات NLP والمراجعات', records: data?.ai.feedback.length ?? null, note: 'تصنيف توضيحي — ينتظر NLP فعليًا' },
    { topic: 'حالات مراجعة السلامة', records: data?.ai.safetyCases.length ?? null, note: 'عينة مراجعة بشرية — لا تنشئ عقوبات' },
    { topic: 'التعرفة والأجور', records: data?.trips.filter((trip) => trip.status === 'مكتملة').length ?? null, note: 'قيمة الأجرة تجريبية؛ لا توجد سياسة تعرفة معتمدة' },
    { topic: 'المدفوعات والتسويات', records: null, note: 'غير موصولة — يلزم سجل Backend/مزود الدفع' },
    { topic: 'الغرامات والجزاءات', records: null, note: 'غير موصولة — لا تُعرض عقوبة بلا سياسة ومراجعة' },
    { topic: 'تقييم الموديل', records: null, note: 'غير متاح — لا توجد نتائج held-out موصولة' },
  ];
  const exportCsv = () => {
    if (!routeRows.length && !data?.ai) return;
    const lines = [['القسم', 'المؤشر', 'عدد السجلات/القيمة', 'مصدر البيانات والحالة'], ...routeRows.map((row) => ['المسارات', row.name, `${row.trips} رحلة · ${row.revenue} ج.م`, row.status]), ...aiReportRows.map((row) => ['AI/حوكمة', row.topic, row.records ?? 'غير متاح', row.note])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map((line) => line.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'nqla-report-demo.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const completed = data?.trips.filter((trip) => trip.status === 'مكتملة').length ?? 0;
  const completion = data?.trips.length ? Math.round(completed / data.trips.length * 100) : 0;

  return <>
    <PageHeading title="التقارير والتحليلات" subtitle="قراءة مؤشرات الخدمة والمسارات اعتمادًا على سجلات العينة التجريبية." icon={<Activity size={17} />} actions={<button className="button button-secondary" onClick={exportCsv}><Download size={16} /> تصدير التقرير</button>} />
    {error && <div className="inline-error"><span>{error}</span><button onClick={reload}>إعادة المحاولة</button></div>}
    <div className="report-context"><CalendarDays size={15} /> النطاق: <b>سجلات العينة الحالية</b><span>·</span> مخطط الأسبوع اصطناعي للتوضيح، والأرقام أكاديمية غير إنتاجية</div>
    <div className="metric-grid metric-grid-compact">
      <MetricCard title="الرحلات المكتملة" value={loading ? '—' : completed.toLocaleString('ar-EG')} note="في عينة الرحلات" icon={<Activity size={19} />} accent="teal" />
      <MetricCard title="معدل الإكمال" value={loading ? '—' : `${completion}٪`} note="من الرحلات المعروضة" icon={<TrendingUp size={19} />} accent="blue" />
      <MetricCard title="الطلبات الجديدة" value={loading ? '—' : String(data?.requests.filter((request) => request.status === 'جديد').length ?? 0)} note="بانتظار الإسناد" icon={<CalendarDays size={19} />} accent="amber" />
      <MetricCard title="متوسط تقييم السائق" value={loading ? '—' : (data!.drivers.reduce((sum, driver) => sum + driver.rating, 0) / Math.max(1, data!.drivers.length)).toFixed(1)} note="من خمس نجوم" icon={<TrendingUp size={19} />} accent="violet" />
    </div>
    <div className="report-charts-grid">
      <section className="panel report-chart-panel">
        <div className="panel-heading"><div><span className="panel-kicker">اتجاه تجريبي توضيحي</span><h2>الرحلات والطلبات خلال الأسبوع</h2></div><span className="chart-unit">عدد العمليات</span></div>
        <div className="report-chart-wrap">{loading ? <div className="chart-loading"><span /><span /><span /><span /><span /><span /></div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.trend} margin={{ top: 12, right: 0, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf1f4" strokeDasharray="3 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82909b', fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#82909b', fontSize: 10 }} /><Tooltip contentStyle={{ border: '1px solid #e7edf0', borderRadius: 12, direction: 'rtl', fontFamily: 'inherit', fontSize: 12 }} /><Legend align="right" verticalAlign="top" height={40} iconType="circle" /><Bar dataKey="trips" name="رحلات" fill="#0d8587" radius={[5, 5, 0, 0]} maxBarSize={24} /><Bar dataKey="requests" name="طلبات" fill="#c9e8e5" radius={[5, 5, 0, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer>}</div>
      </section>
      <section className="panel report-chart-panel driver-state-report">
        <div className="panel-heading"><div><span className="panel-kicker">التواجد</span><h2>حالة السائقين</h2></div></div>
        <div className="pie-chart-wrap">{loading ? <div className="chart-loading"><span /><span /><span /></div> : <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={driverStates} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">{driverStates.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip contentStyle={{ border: '1px solid #e7edf0', borderRadius: 12, direction: 'rtl', fontFamily: 'inherit', fontSize: 12 }} /></PieChart></ResponsiveContainer>}<div className="pie-center"><b>{data?.drivers.length ?? '—'}</b><small>سائق</small></div></div>
        <div className="pie-legend">{driverStates.map((item, index) => <span key={item.name}><i style={{ backgroundColor: COLORS[index] }} />{item.name}<b>{item.value}</b></span>)}</div>
      </section>
    </div>
    <section className="panel route-report-panel"><div className="panel-heading"><div><span className="panel-kicker">أداء الخطوط</span><h2>ملخص المسارات</h2></div><span className="report-footnote">الأعداد والإيرادات محسوبة من سجلات العينة</span></div><DataTable rows={routeRows} columns={routeColumns} loading={loading} error={error} onRetry={reload} emptyTitle="لا توجد بيانات مسارات" /></section>
    <section className="panel ai-report-scope-panel"><div className="panel-heading"><div><span className="panel-kicker">FR-13 · تقارير الإدارة والذكاء التشغيلي</span><h2>تغطية التقارير ومصدر كل مؤشر</h2></div><span className="ai-nonproduction-tag">بيانات العرض ليست تشغيلية</span></div><div className="ai-report-scope-grid">{aiReportRows.map((row) => <article className="ai-report-scope-card" key={row.topic}><div><b>{row.topic}</b><span>{row.records === null ? 'غير متاح' : `${row.records} سجل في العينة`}</span></div><small>{row.note}</small></article>)}</div><div className="ai-explanation-note"><b>تنبيه:</b> قسم التعرفة مبني على أجور Mock لا على تحصيل مالي. لا توجد مدفوعات أو غرامات أو قياسات جودة AI حقيقية حتى يوفّر فريق Backend/Machine Learning عقد API ومصدر بيانات موثّقًا.</div></section>
  </>;
}
