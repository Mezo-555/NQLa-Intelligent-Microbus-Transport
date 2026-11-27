import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpLeft } from 'lucide-react';

export function MetricCard({ title, value, note, change, icon, accent = 'teal' }: { title: string; value: string; note: string; change?: string; icon: ReactNode; accent?: 'teal' | 'blue' | 'amber' | 'violet' }) {
  const positive = !change || !change.startsWith('-');
  return <article className={`metric-card accent-${accent}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-note">{note}</span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span>{title}</span>{change && <span className={`metric-change ${positive ? 'up' : 'down'}`}>{positive ? <ArrowUpLeft size={14} /> : <ArrowDownRight size={14} />}{change}</span>}</div></article>;
}

export function MiniBar({ value, label }: { value: number; label: string }) {
  return <div className="mini-bar-item"><div className="mini-bar-track"><span style={{ height: `${Math.max(7, Math.min(value, 100))}%` }} /></div><small>{label}</small></div>;
}
