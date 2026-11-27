import { useCallback, useMemo, useState } from 'react';
import { BusFront, CheckCircle2, Download, MapPin, MoreHorizontal, Phone, ShieldAlert, Star, UserRoundCheck } from 'lucide-react';
import { mockAdminApi, getDriverStateCounts } from '../../data/mockAdminApi';
import { fetchApiDrivers, isAdminApiConfigured } from '../../data/adminHttpApi';
import type { Driver } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { DataTable, FieldValue, FilterChip, Modal, PageHeading, SearchBox, StatusBadge, type Column } from '../../components/ui';
import { MetricCard } from '../../components/MetricCard';

function downloadCsv(rows: Driver[]) {
  const header = ['ID', 'الاسم', 'الهاتف', 'المركبة', 'المسار', 'الحالة', 'التقييم'];
  const body = rows.map((driver) => [driver.id, driver.name, driver.phone, driver.vehicle, driver.routeName, driver.state, driver.rating]);
  const csv = '\uFEFF' + [header, ...body].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'nqla-drivers-demo.csv'; anchor.click(); URL.revokeObjectURL(url);
}

export function DriversPage() {
  const loader = useCallback(() => fetchApiDrivers(), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('الكل');
  const [selected, setSelected] = useState<Driver | null>(null);
  const drivers = data ?? [];
  const counts = getDriverStateCounts(drivers);
  const filtered = useMemo(() => drivers.filter((driver) => {
    const text = `${driver.id} ${driver.name} ${driver.phone} ${driver.vehicle} ${driver.routeName}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (stateFilter === 'الكل' || driver.state === stateFilter);
  }), [drivers, search, stateFilter]);

  const toggleAccount = async (driver: Driver) => {
    await mockAdminApi.setDriverAccount(driver.id, driver.account === 'نشط' ? 'مقيّد' : 'نشط');
    reload();
    setSelected(null);
  };

  const columns: Column<Driver>[] = [
    { title: 'السائق', key: 'name', render: (driver) => <button className="person-cell person-button" onClick={() => setSelected(driver)}><span className="avatar avatar-teal">{driver.name.slice(0, 1)}</span><span><b>{driver.name}</b><small>{driver.id}</small></span></button> },
    { title: 'رقم الهاتف', key: 'phone', render: (driver) => <span className="phone-cell"><Phone size={13} />{driver.phone}</span> },
    { title: 'المركبة', key: 'vehicle', render: (driver) => <div className="two-line-cell"><b>{driver.vehicle}</b><small>{driver.plate}</small></div> },
    { title: 'المسار', key: 'route', render: (driver) => <span className="muted-cell"><MapPin size={13} />{driver.routeName}</span> },
    { title: 'التقييم', key: 'rating', render: (driver) => <span className="rating-cell"><Star size={14} fill="currentColor" />{driver.rating.toFixed(1)}</span> },
    { title: 'حالة الاتصال', key: 'state', render: (driver) => <StatusBadge value={driver.state} /> },
    { title: '', key: 'actions', className: 'action-column', render: (driver) => <button className="icon-button row-menu" aria-label={`إجراءات ${driver.name}`} onClick={() => setSelected(driver)}><MoreHorizontal size={18} /></button> },
  ];

  return <>
    <PageHeading title="إدارة السائقين" subtitle="تابع السائقين وحالاتهم التشغيلية وحساباتهم من مكان واحد." icon={<BusFront size={17} />} actions={<button className="button button-secondary" onClick={() => downloadCsv(filtered)}><Download size={16} /> تصدير CSV</button>} />
    <div className={`api-source-notice${isAdminApiConfigured ? ' connected' : ''}`}><span />{isAdminApiConfigured ? 'المصدر: API تدريب محلي · GET فقط؛ تعديلات الحساب لم تُربط بعد.' : 'المصدر: بيانات Mock محلية · عينة العرض قابلة لإعادة الضبط.'}</div>
    <div className="metric-grid metric-grid-compact">
      <MetricCard title="سائق متاح" value={String(counts.available).padStart(2, '0')} note="جاهز لاستقبال الطلبات" icon={<UserRoundCheck size={19} />} accent="teal" />
      <MetricCard title="في رحلة" value={String(counts.onTrip).padStart(2, '0')} note="رحلات نشطة الآن" icon={<BusFront size={19} />} accent="blue" />
      <MetricCard title="غير متصل" value={String(counts.offline).padStart(2, '0')} note="آخر ظهور محفوظ" icon={<MapPin size={19} />} accent="amber" />
      <MetricCard title="حساب مقيّد" value={String(counts.suspended).padStart(2, '0')} note="إجراء إداري تجريبي" icon={<ShieldAlert size={19} />} accent="violet" />
    </div>
    <section className="panel list-panel">
      <div className="list-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="ابحث باسم السائق أو رقمه أو المركبة…" /><div className="toolbar-pills">{['الكل', 'متاح', 'في رحلة', 'غير متصل', 'موقوف'].map((filter) => <FilterChip key={filter} active={stateFilter === filter} onClick={() => setStateFilter(filter)}>{filter}</FilterChip>)}</div></div>
      <DataTable rows={filtered} columns={columns} loading={loading} error={error} onRetry={reload} emptyTitle="مفيش سائقين مطابقين" />
    </section>
    {selected && <Modal title="ملف السائق" subtitle={`${selected.id} · ${isAdminApiConfigured ? 'قراءة من API التدريب' : 'بيانات Mock'}`} onClose={() => setSelected(null)} footer={<><button className="button button-secondary" onClick={() => setSelected(null)}>إغلاق</button><button disabled={isAdminApiConfigured} title={isAdminApiConfigured ? 'يحتاج هذا الإجراء إلى PATCH API غير متاح في خادم التدريب الحالي.' : undefined} className={`button ${selected.account === 'نشط' ? 'button-danger' : 'button-primary'}`} onClick={() => void toggleAccount(selected)}>{isAdminApiConfigured ? 'تعديل الحساب غير متاح (GET فقط)' : selected.account === 'نشط' ? 'تقييد الحساب' : 'إعادة التفعيل'}</button></>}>
      <div className="profile-head"><span className="avatar avatar-large avatar-teal">{selected.name.slice(0, 1)}</span><div><h3>{selected.name}</h3><span>{selected.phone}</span></div><StatusBadge value={selected.account} /></div>
      <div className="detail-grid"><FieldValue label="المركبة" value={selected.vehicle} /><FieldValue label="رقم اللوحة" value={selected.plate} /><FieldValue label="المسار المسجل" value={selected.routeName} /><FieldValue label="الحالة الحالية" value={<StatusBadge value={selected.state} />} /><FieldValue label="الرحلات المكتملة" value={selected.completedTrips.toLocaleString('ar-EG')} /><FieldValue label="متوسط التقييم" value={<span className="rating-cell"><Star size={14} fill="currentColor" />{selected.rating.toFixed(1)}</span>} /><FieldValue label="آخر ظهور" value={selected.lastSeen} /><FieldValue label="حالة الحساب" value={<span className="account-good"><CheckCircle2 size={15} />{selected.account}</span>} /></div>
      <div className="modal-callout"><BusFront size={16} /><span>{isAdminApiConfigured ? 'هذا الخادم يعيد قراءة بيانات السائق فقط. لا تغيّر الواجهة حالة الحساب حتى يضيف Backend مسار PATCH مع التحقق من الصلاحيات.' : 'تغيير حالة الحساب هنا محاكاة محلية؛ سيتم ربطه بصلاحيات المشرف في الـBackend.'}</span></div>
    </Modal>}
  </>;
}
