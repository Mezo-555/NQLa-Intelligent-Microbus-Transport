import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, ShieldAlert, UserRoundCheck } from 'lucide-react';
import type { SafetyCase } from '../../data/aiTypes';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';

type Props = { cases: SafetyCase[]; onAction: (action: () => Promise<void>) => Promise<void> };

function SafetyReviewCard({ item, onAction }: { item: SafetyCase; onAction: Props['onAction'] }) {
  const [note, setNote] = useState('');
  const closed = item.state === 'اكتملت المراجعة التجريبية';
  const stateAction = (state: SafetyCase['state']) => onAction(() => mockAiAdminApi.reviewSafety(item.id, state, note));
  return <article className="ai-safety-card">
    <div className="ai-card-topline"><span className="ai-mini-id">{item.id}</span><span className={`ai-state-chip ${closed ? 'sent' : 'warning'}`}>{item.state}</span></div>
    <div className="ai-safety-freshness"><Clock3 size={12} /> لقطة بيانات العرض: {item.snapshotAt} · غير متصلة وليست تحديثًا حيًا</div>
    <div className="ai-safety-person"><span className="ai-safety-avatar"><UserRoundCheck size={19} /></span><div><b>{item.driverName}</b><small>{item.driverId} · عدم اليقين: {item.uncertainty}</small></div><div className="ai-safety-score"><strong>{item.scoreDemo}</strong><small>/ 100 · Demo</small></div></div>
    <div className="ai-score-warning"><AlertTriangle size={14} /><span>{item.scoreScaleNote}. لا تستخدم هذه الدرجة لتقييد حساب أو إنزال عقوبة.</span></div>
    <p className="ai-safety-reason">{item.reviewReason}</p>
    <div className="ai-factor-list">{item.factors.map((factor) => <div className="ai-factor-row" key={factor.label}><span><FileSearch size={14} />{factor.label}</span><p>{factor.description}</p><small>المصدر: {factor.source}</small></div>)}</div>
    <label className="ai-review-note"><span>ملاحظة المراجع (اختياري)</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="اكتب ملخص التحقق البشري…" /></label>
    <div className="ai-card-actions">
      {!closed && <button className="button button-secondary button-small" onClick={() => stateAction('اكتملت المراجعة التجريبية')}><CheckCircle2 size={13} /> تسجيل مراجعة بشرية تجريبية</button>}
      <button className="button button-quiet button-small" onClick={() => stateAction('طلب تصحيح تجريبي')}><ShieldAlert size={13} /> طلب تصحيح/اعتراض</button>
    </div>
  </article>;
}

export function SafetyTab({ cases, onAction }: Props) {
  const pending = cases.filter((item) => item.state === 'تحتاج مراجعة بشرية').length;
  return <div className="ai-tab-stack">
    <div className="ai-section-heading"><div><span className="panel-kicker">FR-12.3–12.5 · AIQ-05 · UR-A05</span><h2>مؤشرات السلامة والمراجعة البشرية</h2><p>توضح الشاشة أسباب الإشارة والأدلة ومصدرها وحداثة اللقطة وعدم اليقين؛ لا يتحول المؤشر وحده إلى قرار ضد السائق.</p></div><span className="ai-nonproduction-tag"><ShieldAlert size={13} /> {pending} حالة تحتاج مراجعة</span></div>
    <div className="ai-human-review-banner"><ShieldAlert size={18} /><div><b>المراجعة البشرية إلزامية للقرارات المؤثرة</b><p>أي درجة سلامة تعتمد في النظام الفعلي على إشارات مُتحقق منها وتقييمات وبيانات حركة مسموح بها أثناء الوردية/الرحلة فقط. لا تُحسب إشارة واحدة كحكم، ولا تُفرض عقوبة تلقائية.</p></div></div>
    <div className="ai-safety-grid">{cases.map((item) => <SafetyReviewCard key={item.id} item={item} onAction={onAction} />)}</div>
    <div className="ai-evaluation-strip"><AlertTriangle size={15} /><span>AIQ-05 ينتظر بيانات ممثلة واختبار استقرار الدرجة عبر الزمن، ومراجعة التنبيهات الخاطئة، وفحص الفروق بين المجموعات حيثما كان ذلك قانونيًا ومدعومًا بالبيانات. الدرجة هنا لا تجتاز أي تقييم.</span></div>
    <div className="ai-explanation-note"><b>مهم لفريق Mobile:</b> يلزم أن يرى السائق الملاحظات المرتبطة به وأسباب درجته فقط، مع طلب تصحيح ومراجعة بشرية. هذه الشاشة تخص قرار المشرف التجريبي؛ ربط شاشة السائق من مسؤولية Track 1/Backend.</div>
  </div>;
}
