import type { ReactNode } from 'react';
import { AlertTriangle, Check, ChevronLeft, LoaderCircle, RefreshCw, Search } from 'lucide-react';

export function PageHeading({ title, subtitle, icon, actions }: { title: string; subtitle: string; icon?: ReactNode; actions?: ReactNode }) {
  return <div className="page-heading"><div className="heading-copy"><div className="eyebrow">{icon}{title}</div><h1>{title}</h1><p>{subtitle}</p></div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

export function StatusBadge({ value }: { value: string }) {
  const key = value.includes('متاح') || value.includes('نشط') || value.includes('مكتمل') ? 'good'
    : value.includes('جديد') || value.includes('جاري') || value.includes('مُسند') || value.includes('رحلة') ? 'info'
    : value.includes('ملغي') || value.includes('موقوف') || value.includes('مقيّد') || value.includes('غير متصل') ? 'danger'
    : 'neutral';
  return <span className={`status-badge ${key}`}><i />{value}</span>;
}

export function SearchBox({ value, onChange, placeholder = 'ابحث بالاسم أو رقم المعرف…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-box"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function LoadingState({ label = 'بنجهز البيانات…' }: { label?: string }) {
  return <div className="state-panel"><LoaderCircle className="spinner" size={25} /><strong>{label}</strong><span>محاكاة استجابة الخدمة المحلية</span></div>;
}

export function EmptyState({ title = 'مفيش بيانات للعرض', subtitle = 'جرّب تغيير البحث أو الفلاتر.' }: { title?: string; subtitle?: string }) {
  return <div className="state-panel empty-state"><span className="empty-orbit"><Search size={20} /></span><strong>{title}</strong><span>{subtitle}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="state-panel error-state"><AlertTriangle size={25} /><strong>حصلت مشكلة في تحميل البيانات</strong><span>{message}</span><button className="button button-secondary" onClick={onRetry}><RefreshCw size={15} /> إعادة المحاولة</button></div>;
}

export interface Column<T> { title: string; key: string; render: (item: T) => ReactNode; className?: string; }
export function DataTable<T extends { id: string }>({ rows, columns, loading, error, onRetry, emptyTitle }: { rows: T[]; columns: Column<T>[]; loading?: boolean; error?: string | null; onRetry?: () => void; emptyTitle?: string }) {
  if (loading) return <div className="table-card"><LoadingState /></div>;
  if (error) return <div className="table-card"><ErrorState message={error} onRetry={onRetry ?? (() => undefined)} /></div>;
  if (!rows.length) return <div className="table-card"><EmptyState title={emptyTitle} /></div>;
  return <div className="table-card"><div className="table-scroll"><table><thead><tr>{columns.map((column) => <th className={column.className} key={column.key}>{column.title}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td className={column.className} key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div><div className="table-foot"><span>عرض <b>{rows.length}</b> سجل</span><span>بيانات تجريبية <Check size={13} /></span></div></div>;
}

export function Modal({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button modal-close" onClick={onClose} aria-label="إغلاق"><ChevronLeft size={19} /></button></header><div className="modal-body">{children}</div>{footer && <footer className="modal-footer">{footer}</footer>}</section></div>;
}

export function FilterChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`filter-chip ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>;
}

export function FieldValue({ label, value }: { label: string; value: ReactNode }) {
  return <div className="field-value"><span>{label}</span><strong>{value}</strong></div>;
}
