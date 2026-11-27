import { useCallback, useState } from 'react';
import { ArrowLeft, BusFront, Check, ChevronDown, ChevronUp, MapPin, Plus, Route as RouteIcon, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { TransitRoute } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { FieldValue, Modal, PageHeading, StatusBadge } from '../../components/ui';

export function RoutesPage() {
  const loader = useCallback(() => mockAdminApi.getRoutes(), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [expanded, setExpanded] = useState<string | null>('RT-01');
  const [selected, setSelected] = useState<TransitRoute | null>(null);
  const [adding, setAdding] = useState(false);
  const [stationRoute, setStationRoute] = useState<TransitRoute | null>(null);
  const [routeName, setRouteName] = useState('');
  const [stationName, setStationName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStation, setSavingStation] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleStatus = async (route: TransitRoute) => {
    await mockAdminApi.setRouteStatus(route.id, route.status === 'نشط' ? 'موقوف' : 'نشط');
    reload();
  };
  const addRoute = async () => {
    const value = routeName.trim();
    if (!value) { setNotice('اكتب اسم المسار أولًا.'); return; }
    setSaving(true); setNotice(null);
    try {
      await mockAdminApi.addDemoRoute(value);
      setRouteName(''); setAdding(false); setExpanded(null); reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذر إضافة المسار التجريبي.');
    } finally {
      setSaving(false);
    }
  };
  const addStation = async () => {
    if (!stationRoute) return;
    const value = stationName.trim();
    if (!value) { setNotice('اكتب اسم المحطة أولًا.'); return; }
    setSavingStation(true); setNotice(null);
    try {
      await mockAdminApi.addDemoStation(stationRoute.id, value);
      setExpanded(stationRoute.id); setStationName(''); setStationRoute(null); reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذر إضافة المحطة التجريبية.');
    } finally {
      setSavingStation(false);
    }
  };
  const removeStation = async (route: TransitRoute, stationId: string) => {
    setNotice(null);
    try {
      await mockAdminApi.removeDemoStation(route.id, stationId);
      reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذر حذف المحطة التجريبية.');
    }
  };

  return <>
    <PageHeading title="المسارات والمحطات" subtitle="نظّم خطوط الميكروباص وتسلسل المحطات والسائقين المرتبطين بكل مسار." icon={<RouteIcon size={17} />} actions={<button className="button button-primary" onClick={() => { setNotice(null); setAdding(true); }}><Plus size={16} /> إضافة مسار تجريبي</button>} />
    <div className="route-summary-strip"><div><span className="route-summary-icon"><RouteIcon size={19} /></span><div><b>{data?.length ?? '—'}</b><small>مسارات معرفة</small></div></div><div><span className="route-summary-icon blue-bg"><BusFront size={19} /></span><div><b>{data?.reduce((sum, route) => sum + route.driverCount, 0) ?? '—'}</b><small>سائق على المسارات</small></div></div><div><span className="route-summary-icon amber-bg"><MapPin size={19} /></span><div><b>{data?.reduce((sum, route) => sum + route.stations.length, 0) ?? '—'}</b><small>محطة ضمن العينة</small></div></div><div className="route-demo-note">بيانات المسارات والمحطات محاكاة محلية.</div></div>
    {error && <div className="inline-error"><span>{error}</span><button onClick={reload}>إعادة المحاولة</button></div>}
    {notice && !adding && !stationRoute && <div className="inline-error">{notice}</div>}
    {loading ? <div className="route-loading"><span /><span /><span /></div> : <div className="routes-grid">{(data ?? []).map((route, index) => <article className={`route-card${route.status === 'موقوف' ? ' route-inactive' : ''}`} key={route.id} style={{ animationDelay: `${index * 45}ms` }}>
      <button className="route-card-head" onClick={() => setExpanded(expanded === route.id ? null : route.id)}><span className="route-color-marker" style={{ backgroundColor: route.color }}><RouteIcon size={19} /></span><span className="route-card-name"><small>{route.id}</small><b>{route.name}</b></span><StatusBadge value={route.status} /><span className="route-card-chevron">{expanded === route.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</span></button>
      <div className="route-card-meta"><span><MapPin size={14} />{route.stations.length} محطات</span><span><BusFront size={14} />{route.driverCount} سائق</span><button onClick={() => void toggleStatus(route)} className="route-toggle">{route.status === 'نشط' ? <><ToggleRight size={19} /> إيقاف</> : <><ToggleLeft size={19} /> تفعيل</>}</button></div>
      {expanded === route.id && <div className="station-list"><div className="station-list-title"><span>تسلسل المحطات</span><div className="station-list-actions"><button className="button button-quiet button-small" onClick={() => { setNotice(null); setStationRoute(route); setStationName(''); }}><Plus size={13} /> محطة</button><button className="button button-quiet button-small" onClick={() => setSelected(route)}>التفاصيل <ArrowLeft size={13} /></button></div></div><div className="station-flow">{route.stations.map((station, stationIndex) => <div className="station-item" key={station.id}><span className="station-number" style={{ borderColor: route.color, color: route.color }}>{String(stationIndex + 1).padStart(2, '0')}</span><div><b>{station.name}</b><small>{stationIndex === 0 ? 'بداية المسار' : stationIndex === route.stations.length - 1 ? 'نهاية المسار' : 'محطة توقف'}</small></div>{stationIndex < route.stations.length - 1 && <span className="station-connector" />}<button className="station-remove" aria-label={`حذف ${station.name}`} title="حذف المحطة" disabled={route.stations.length <= 2} onClick={() => void removeStation(route, station.id)}><Trash2 size={13} /></button></div>)}</div></div>}
    </article>)}</div>}
    {selected && <Modal title={selected.name} subtitle={`${selected.id} · تفاصيل المسار التجريبي`} onClose={() => setSelected(null)} footer={<button className="button button-secondary" onClick={() => setSelected(null)}>إغلاق</button>}>
      <div className="route-modal-line" style={{ borderColor: selected.color }}><RouteIcon style={{ color: selected.color }} size={23} /><b>{selected.name}</b><StatusBadge value={selected.status} /></div>
      <div className="detail-grid"><FieldValue label="معرّف المسار" value={selected.id} /><FieldValue label="الحالة" value={<StatusBadge value={selected.status} />} /><FieldValue label="السائقون المرتبطون" value={`${selected.driverCount} سائق`} /><FieldValue label="عدد المحطات" value={`${selected.stations.length} محطة`} /></div>
      <div className="modal-subheading"><span><MapPin size={16} /> المحطات بالترتيب</span><b>{selected.stations.length}</b></div><div className="station-list modal-stops">{selected.stations.map((station, index) => <div className="station-item" key={station.id}><span className="station-number" style={{ borderColor: selected.color, color: selected.color }}>{index + 1}</span><div><b>{station.name}</b><small>{station.id}</small></div>{index === 0 && <Check size={15} className="account-good" />}</div>)}</div>
    </Modal>}
    {adding && <Modal title="إضافة مسار تجريبي" subtitle="سيُضاف محليًا لهذه الجلسة فقط." onClose={() => setAdding(false)} footer={<><button className="button button-secondary" onClick={() => setAdding(false)}>إلغاء</button><button className="button button-primary" disabled={saving} onClick={() => void addRoute()}>{saving ? 'جارٍ الحفظ…' : 'إضافة المسار'}</button></>}>
      <label className="form-field"><span>اسم المسار</span><input autoFocus value={routeName} onChange={(event) => setRouteName(event.target.value)} placeholder="مثال: محطة الرمل – سموحة" /></label>
      <div className="modal-callout"><MapPin size={16} /><span>سيُنشأ المسار بمحطات تجريبية أولية. يمكنك بعد ذلك إضافة محطات أو حذفها.</span></div>{notice && <div className="inline-error">{notice}</div>}
    </Modal>}
    {stationRoute && <Modal title={`إضافة محطة · ${stationRoute.name}`} subtitle="ستُضاف بعد المحطة الأخيرة في التسلسل التجريبي." onClose={() => setStationRoute(null)} footer={<><button className="button button-secondary" onClick={() => setStationRoute(null)}>إلغاء</button><button className="button button-primary" disabled={savingStation} onClick={() => void addStation()}>{savingStation ? 'جارٍ الإضافة…' : 'إضافة المحطة'}</button></>}>
      <label className="form-field"><span>اسم المحطة</span><input autoFocus value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="مثال: محطة سيدي جابر" /></label>
      <div className="modal-callout"><MapPin size={16} /><span>الإحداثيات التخطيطية ستُحدد تلقائيًا لأغراض عرض الخريطة فقط.</span></div>{notice && <div className="inline-error">{notice}</div>}
    </Modal>}
  </>;
}
