import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, BusFront, CircleDollarSign, Clock3, MapPin, Route as RouteIcon, Star, UserRound } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { Trip, TripState } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { DataTable, FieldValue, FilterChip, Modal, PageHeading, SearchBox, StatusBadge, type Column } from '../../components/ui';
import { MetricCard } from '../../components/MetricCard';

const filters = ['الكل', 'مُسندة', 'جارية', 'مكتملة', 'ملغاة'];

export function TripsPage() {
  const loader = useCallback(() => mockAdminApi.getTrips(), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [selected, setSelected] = useState<Trip | null>(null);
  const trips = data ?? [];
  const filtered = useMemo(() => trips.filter((trip) => {
    const text = `${trip.id} ${trip.driverName} ${trip.passengerName} ${trip.routeName} ${trip.from} ${trip.to}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === 'الكل' || trip.status === statusFilter);
  }), [trips, search, statusFilter]);
  const active = trips.filter((trip) => trip.status === 'جارية' || trip.status === 'مُسندة').length;
  const completed = trips.filter((trip) => trip.status === 'مكتملة').length;
  const revenue = trips.filter((trip) => trip.status === 'مكتملة').reduce((sum, trip) => sum + trip.fare, 0);

  const updateStatus = async (trip: Trip, status: TripState) => {
    await mockAdminApi.setTripStatus(trip.id, status);
    reload();
    setSelected(null);
  };

  const columns: Column<Trip>[] = [
    { title: 'رقم الرحلة', key: 'id', render: (trip) => <button className="id-link" onClick={() => setSelected(trip)}>{trip.id}<small>{trip.startedAt}</small></button> },
    { title: 'السائق', key: 'driver', render: (trip) => <span className="person-cell compact-person"><span className="avatar avatar-teal avatar-small">{trip.driverName.slice(0, 1)}</span><b>{trip.driverName}</b></span> },
    { title: 'الراكب', key: 'passenger', render: (trip) => <span className="person-cell compact-person"><span className="avatar avatar-violet avatar-small">{trip.passengerName.slice(0, 1)}</span><b>{trip.passengerName}</b></span> },
    { title: 'المسار', key: 'route', render: (trip) => <div className="two-line-cell"><b>{trip.from} <ArrowLeft size={12} /> {trip.to}</b><small>{trip.routeName}</small></div> },
    { title: 'المدة', key: 'duration', render: (trip) => <span className="phone-cell"><Clock3 size={13} />{trip.duration}</span> },
    { title: 'الأجرة', key: 'fare', render: (trip) => <b>{trip.fare} ج.م</b> },
    { title: 'الحالة', key: 'status', render: (trip) => <StatusBadge value={trip.status} /> },
    { title: '', key: 'action', className: 'action-column', render: (trip) => <button className="button button-quiet button-small" onClick={() => setSelected(trip)}>التفاصيل <ArrowLeft size={13} /></button> },
  ];

  return <>
    <PageHeading title="متابعة الرحلات" subtitle="استعرض الرحلات المُسندة والجارية والمكتملة والملغاة وتفاصيل كل رحلة." icon={<RouteIcon size={17} />} actions={<button className="button button-secondary" onClick={reload}><Clock3 size={16} /> تحديث</button>} />
    <div className="metric-grid metric-grid-compact"><MetricCard title="رحلة جارية" value={String(active).padStart(2, '0')} note="تحت المتابعة الآن" icon={<BusFront size={19} />} accent="blue" /><MetricCard title="رحلة مكتملة" value={String(completed).padStart(2, '0')} note="في العينة المعروضة" icon={<RouteIcon size={19} />} accent="teal" /><MetricCard title="إجمالي أجور مكتملة" value={`${revenue.toLocaleString('ar-EG')} ج.م`} note="بيانات محاكاة" icon={<CircleDollarSign size={19} />} accent="amber" /><MetricCard title="رضا الرحلات" value="4.8 / 5" note="مؤشر تجريبي" icon={<Star size={19} />} accent="violet" /></div>
    <section className="panel list-panel"><div className="list-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="ابحث برقم الرحلة أو السائق أو الراكب…" /><div className="toolbar-pills">{filters.map((filter) => <FilterChip key={filter} active={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{filter}</FilterChip>)}</div></div><DataTable rows={filtered} columns={columns} loading={loading} error={error} onRetry={reload} emptyTitle="لا توجد رحلات بهذه الحالة" /></section>
    {selected && <Modal title={`تفاصيل الرحلة ${selected.id}`} subtitle={`${selected.startedAt} · بيانات تشغيل تجريبية`} onClose={() => setSelected(null)} footer={<><button className="button button-secondary" onClick={() => setSelected(null)}>إغلاق</button>{(selected.status === 'جارية' || selected.status === 'مُسندة') && <button className="button button-danger" onClick={() => void updateStatus(selected, 'ملغاة')}>إلغاء الرحلة</button>}</>}>
      <div className="trip-modal-banner"><div className="trip-banner-icon"><RouteIcon size={22} /></div><div><b>{selected.routeName}</b><span>{selected.from} <ArrowLeft size={13} /> {selected.to}</span></div><StatusBadge value={selected.status} /></div>
      <div className="detail-grid"><FieldValue label="السائق" value={<span className="inline-icon"><BusFront size={14} />{selected.driverName} · {selected.driverId}</span>} /><FieldValue label="الراكب" value={<span className="inline-icon"><UserRound size={14} />{selected.passengerName} · {selected.passengerId}</span>} /><FieldValue label="وقت البداية" value={selected.startedAt} /><FieldValue label="مدة الرحلة" value={<span className="inline-icon"><Clock3 size={14} />{selected.duration}</span>} /><FieldValue label="الأجرة" value={<span className="inline-icon"><CircleDollarSign size={14} />{selected.fare} ج.م</span>} /><FieldValue label="الحالة" value={<StatusBadge value={selected.status} />} /><FieldValue label="مسار الخدمة" value={selected.routeName} /><FieldValue label="نقطة الوصول" value={<span className="inline-icon"><MapPin size={14} />{selected.to}</span>} /></div>
      <div className="modal-callout"><RouteIcon size={16} /><span>تحديث الحالة يغيّر بيانات الجلسة التجريبية فقط ولا يرسل إشعارًا فعليًا.</span></div>
    </Modal>}
  </>;
}
