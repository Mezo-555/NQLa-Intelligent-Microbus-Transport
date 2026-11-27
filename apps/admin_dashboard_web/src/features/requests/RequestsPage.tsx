import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock3, MapPin, Plus, UserRound, Users } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { RideRequest, RequestState } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { DataTable, FieldValue, FilterChip, Modal, PageHeading, SearchBox, StatusBadge, type Column } from '../../components/ui';

const filters = ['الكل', 'جديد', 'مُسند', 'مكتمل', 'ملغي'];

export function RequestsPage() {
  const loader = useCallback(() => mockAdminApi.getRequests(), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [selected, setSelected] = useState<RideRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requests = data ?? [];
  const filtered = useMemo(() => requests.filter((request) => {
    const content = `${request.id} ${request.passengerName} ${request.from} ${request.to} ${request.driverName ?? ''}`.toLowerCase();
    return content.includes(search.toLowerCase()) && (statusFilter === 'الكل' || request.status === statusFilter);
  }), [requests, search, statusFilter]);

  const changeStatus = async (request: RideRequest, status: RequestState) => {
    setActionError(null);
    try {
      await mockAdminApi.setRequestStatus(request.id, status);
      reload();
      setSelected(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'تعذر تحديث الطلب التجريبي.');
    }
  };
  const addRequest = async () => {
    setActionError(null);
    await mockAdminApi.addDemoRequest();
    reload();
  };

  const columns: Column<RideRequest>[] = [
    { title: 'رقم الطلب', key: 'id', render: (request) => <button className="id-link" onClick={() => setSelected(request)}>{request.id}<small>{request.requestedAt}</small></button> },
    { title: 'الراكب', key: 'passenger', render: (request) => <span className="person-cell compact-person"><span className="avatar avatar-violet avatar-small">{request.passengerName.slice(0, 1)}</span><b>{request.passengerName}</b></span> },
    { title: 'نقطة الانطلاق', key: 'from', render: (request) => <span className="muted-cell"><MapPin size={13} />{request.from}</span> },
    { title: 'الوجهة', key: 'to', render: (request) => <span className="muted-cell"><ArrowLeft size={13} />{request.to}</span> },
    { title: 'السائق', key: 'driver', render: (request) => request.driverName ? <span className="driver-assigned"><UserRound size={14} />{request.driverName}</span> : <span className="muted-cell">بانتظار الإسناد</span> },
    { title: 'الأجرة', key: 'fare', render: (request) => <b>{request.fare} ج.م</b> },
    { title: 'الحالة', key: 'status', render: (request) => <StatusBadge value={request.status} /> },
    { title: 'إجراء تجريبي', key: 'action', className: 'action-column', render: (request) => request.status === 'جديد' ? <button className="button button-primary button-small" onClick={() => void changeStatus(request, 'مُسند')}><Check size={14} /> إسناد</button> : request.status === 'مُسند' ? <button className="button button-quiet button-small" onClick={() => void changeStatus(request, 'ملغي')}>إلغاء الطلب</button> : <button className="button button-quiet button-small" onClick={() => setSelected(request)}>التفاصيل</button> },
  ];

  return <>
    <PageHeading title="الطلبات الواردة" subtitle="راجع نقاط الرحلات، تابع الإسناد، وغيّر الحالة في قاعدة البيانات التجريبية." icon={<Users size={17} />} actions={<button className="button button-primary" onClick={() => void addRequest()}><Plus size={16} /> إضافة طلب تجريبي</button>} />
    <div className="quick-count-row">{filters.slice(1).map((filter) => <button key={filter} className={`quick-count${statusFilter === filter ? ' selected' : ''}`} onClick={() => setStatusFilter(statusFilter === filter ? 'الكل' : filter)}><StatusBadge value={filter} /><b>{requests.filter((request) => request.status === filter).length}</b></button>)}</div>
    {actionError && <div className="inline-error"><span>{actionError}</span><button onClick={() => setActionError(null)}>إخفاء</button></div>}
    <section className="panel list-panel"><div className="list-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="ابحث برقم الطلب أو الراكب أو المنطقة…" /><div className="toolbar-pills">{filters.map((filter) => <FilterChip key={filter} active={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{filter}</FilterChip>)}</div></div><DataTable rows={filtered} columns={columns} loading={loading} error={error} onRetry={reload} emptyTitle="لا توجد طلبات بهذه الحالة" /></section>
    {selected && <Modal title={`الطلب ${selected.id}`} subtitle={`ورد ${selected.requestedAt} · طلب تجريبي`} onClose={() => setSelected(null)} footer={<><button className="button button-secondary" onClick={() => setSelected(null)}>إغلاق</button>{selected.status === 'جديد' && <button className="button button-primary" onClick={() => void changeStatus(selected, 'مُسند')}><Check size={15} /> إسناد لسائق متاح</button>}{selected.status === 'مُسند' && <button className="button button-danger" onClick={() => void changeStatus(selected, 'ملغي')}>إلغاء الطلب</button>}</>}>
      <div className="route-visual"><div className="route-node pickup"><span /><div><small>نقطة الانطلاق</small><b>{selected.from}</b></div></div><div className="route-track"><i /></div><div className="route-node destination"><span /><div><small>الوجهة</small><b>{selected.to}</b></div></div></div>
      <div className="detail-grid"><FieldValue label="اسم الراكب" value={selected.passengerName} /><FieldValue label="معرّف الراكب" value={selected.passengerId} /><FieldValue label="السائق المعيّن" value={selected.driverName ?? 'لم يتم الإسناد'} /><FieldValue label="حالة الطلب" value={<StatusBadge value={selected.status} />} /><FieldValue label="الأجرة التقديرية" value={`${selected.fare} ج.م`} /><FieldValue label="وقت الطلب" value={<span className="inline-icon"><Clock3 size={14} />{selected.requestedAt}</span>} /></div>
      <div className="modal-callout"><Users size={16} /><span>إسناد السائق وتحديث الطلب عمليات محلية تجريبية وليست إرسالًا لخادم.</span></div>
    </Modal>}
  </>;
}
