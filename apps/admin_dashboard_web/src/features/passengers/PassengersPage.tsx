import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Download, HeartHandshake, History, Phone, ShieldCheck, Star, UserRound, Users } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { Passenger, Trip } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { DataTable, FieldValue, FilterChip, Modal, PageHeading, SearchBox, StatusBadge, type Column } from '../../components/ui';
import { MetricCard } from '../../components/MetricCard';

export function PassengersPage() {
  const loader = useCallback(async () => Promise.all([mockAdminApi.getPassengers(), mockAdminApi.getTrips()]), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('الكل');
  const [selected, setSelected] = useState<Passenger | null>(null);
  const passengers = data?.[0] ?? [];
  const trips = data?.[1] ?? [];
  const filtered = useMemo(() => passengers.filter((passenger) => {
    const content = `${passenger.name} ${passenger.id} ${passenger.phone}`.toLowerCase();
    return content.includes(search.toLowerCase()) && (accountFilter === 'الكل' || passenger.account === accountFilter);
  }), [passengers, search, accountFilter]);
  const activeCount = passengers.filter((item) => item.account === 'نشط').length;
  const averageRating = passengers.length ? passengers.reduce((sum, item) => sum + item.rating, 0) / passengers.length : 0;
  const totalRides = passengers.reduce((sum, item) => sum + item.rides, 0);

  const toggleAccount = async (passenger: Passenger) => {
    await mockAdminApi.setPassengerAccount(passenger.id, passenger.account === 'نشط' ? 'مقيّد' : 'نشط');
    reload();
    setSelected(null);
  };
  const exportCsv = () => {
    const lines = [['ID', 'الاسم', 'الهاتف', 'الرحلات', 'التقييم', 'الحساب'], ...filtered.map((p) => [p.id, p.name, p.phone, p.rides, p.rating, p.account])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'nqla-passengers-demo.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const columns: Column<Passenger>[] = [
    { title: 'الراكب', key: 'name', render: (passenger) => <button className="person-cell person-button" onClick={() => setSelected(passenger)}><span className="avatar avatar-violet">{passenger.name.slice(0, 1)}</span><span><b>{passenger.name}</b><small>{passenger.id}</small></span></button> },
    { title: 'رقم الهاتف', key: 'phone', render: (passenger) => <span className="phone-cell"><Phone size={13} />{passenger.phone}</span> },
    { title: 'الرحلات', key: 'rides', render: (passenger) => <span className="ride-count"><History size={14} />{passenger.rides}</span> },
    { title: 'التقييم', key: 'rating', render: (passenger) => <span className="rating-cell"><Star size={14} fill="currentColor" />{passenger.rating.toFixed(1)}</span> },
    { title: 'آخر رحلة', key: 'lastTrip', render: (passenger) => <span className="muted-cell">{passenger.lastTrip}</span> },
    { title: 'حالة الحساب', key: 'account', render: (passenger) => <StatusBadge value={passenger.account} /> },
    { title: '', key: 'action', className: 'action-column', render: (passenger) => <button className="button button-quiet button-small" onClick={() => setSelected(passenger)}>التفاصيل <ArrowLeft size={13} /></button> },
  ];

  return <>
    <PageHeading title="إدارة الركاب" subtitle="ملفات الركاب ونشاطهم وحالة حساباتهم في نسخة العرض التجريبية." icon={<Users size={17} />} actions={<button className="button button-secondary" onClick={exportCsv}><Download size={16} /> تصدير القائمة</button>} />
    <div className="metric-grid metric-grid-compact">
      <MetricCard title="حساب نشط" value={String(activeCount).padStart(2, '0')} note="من إجمالي المسجلين" icon={<UserRound size={19} />} accent="teal" />
      <MetricCard title="رحلة مكتملة" value={totalRides.toLocaleString('ar-EG')} note="إجمالي سجل الركاب" icon={<HeartHandshake size={19} />} accent="blue" />
      <MetricCard title="متوسط تقييم الركاب" value={averageRating.toFixed(1)} note="من خمس نجوم" icon={<Star size={19} />} accent="amber" />
      <MetricCard title="حساب مقيّد" value={String(passengers.filter((p) => p.account === 'مقيّد').length).padStart(2, '0')} note="مراجعة إدارية تجريبية" icon={<AlertCircle size={19} />} accent="violet" />
    </div>
    <section className="panel list-panel">
      <div className="list-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="ابحث باسم الراكب أو رقم الهاتف…" /><div className="toolbar-pills">{['الكل', 'نشط', 'مقيّد'].map((filter) => <FilterChip key={filter} active={accountFilter === filter} onClick={() => setAccountFilter(filter)}>{filter}</FilterChip>)}</div></div>
      <DataTable rows={filtered} columns={columns} loading={loading} error={error} onRetry={reload} emptyTitle="لا يوجد ركاب مطابقون" />
    </section>
    {selected && <PassengerDetails passenger={selected} trips={trips.filter((trip) => trip.passengerId === selected.id)} onClose={() => setSelected(null)} onToggle={() => void toggleAccount(selected)} />}
  </>;
}

function PassengerDetails({ passenger, trips, onClose, onToggle }: { passenger: Passenger; trips: Trip[]; onClose: () => void; onToggle: () => void }) {
  return <Modal title="ملف الراكب" subtitle={`${passenger.id} · انضم ${passenger.joinedAt}`} onClose={onClose} footer={<><button className="button button-secondary" onClick={onClose}>إغلاق</button><button className={passenger.account === 'نشط' ? 'button button-danger' : 'button button-primary'} onClick={onToggle}>{passenger.account === 'نشط' ? 'تقييد الحساب' : 'إعادة التفعيل'}</button></>}>
    <div className="profile-head"><span className="avatar avatar-large avatar-violet">{passenger.name.slice(0, 1)}</span><div><h3>{passenger.name}</h3><span>{passenger.phone}</span></div><StatusBadge value={passenger.account} /></div>
    <div className="detail-grid"><FieldValue label="تاريخ التسجيل" value={passenger.joinedAt} /><FieldValue label="عدد الرحلات" value={passenger.rides} /><FieldValue label="متوسط التقييم" value={<span className="rating-cell"><Star size={14} fill="currentColor" />{passenger.rating.toFixed(1)}</span>} /><FieldValue label="آخر نشاط" value={passenger.lastTrip} /><FieldValue label="حالة الحساب" value={<span className="account-good"><ShieldCheck size={15} />{passenger.account}</span>} /></div>
    <div className="modal-subheading"><span><History size={16} /> آخر الرحلات في البيانات التجريبية</span><b>{trips.length}</b></div>
    {trips.length ? <div className="mini-activity-list">{trips.slice(0, 4).map((trip: Trip) => <div className="mini-activity-row" key={trip.id}><span className="mini-activity-dot" /><div><b>{trip.from} <ArrowLeft size={12} /> {trip.to}</b><small>{trip.id} · {trip.startedAt}</small></div><strong>{trip.fare} ج.م</strong></div>)}</div> : <div className="inline-empty">لا يوجد سجل رحلات تجريبي لهذا الحساب حتى الآن.</div>}
    <div className="modal-callout"><ShieldCheck size={16} /><span>إجراءات الحساب للعرض فقط حتى يتم ربط الصلاحيات والـAPI.</span></div>
  </Modal>;
}
