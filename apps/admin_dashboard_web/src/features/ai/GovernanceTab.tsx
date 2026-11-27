import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock3, Download, Settings2, ShieldCheck } from 'lucide-react';
import type { AIAdminSnapshot, DemoPolicySettings } from '../../data/aiTypes';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';

type Props = { snapshot: AIAdminSnapshot; onAction: (action: () => Promise<void>) => Promise<void> };

function exportCsv(snapshot: AIAdminSnapshot) {
  const rows: (string | number)[][] = [
    ['النوع', 'المعرف', 'العنوان/الحالة', 'المصدر', 'ملاحظة'],
    ...snapshot.alerts.map((item) => ['تنبيه', item.id, item.title, item.source, item.acknowledged ? 'تمت القراءة تجريبيًا' : 'مفتوح']),
    ...snapshot.recommendations.map((item) => ['حافز', item.id, item.state, item.driverId, `${item.targetArea} · ${item.incentiveEgp} ج.م Demo`]),
    ...snapshot.safetyCases.map((item) => ['سلامة', item.id, item.state, item.driverId, item.scoreScaleNote]),
    ...snapshot.feedback.map((item) => ['NLP', item.id, item.state, item.tripId, `${item.sentiment} · ${item.category}`]),
  ];
  const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'nqla-ai-admin-demo.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function GovernanceTab({ snapshot, onAction }: Props) {
  const [shortage, setShortage] = useState(snapshot.settings.shortageThresholdSeats);
  const [stale, setStale] = useState(snapshot.settings.staleLocationThresholdMinutes);
  const [effectiveFrom, setEffectiveFrom] = useState(snapshot.settings.effectiveFrom);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setShortage(snapshot.settings.shortageThresholdSeats);
    setStale(snapshot.settings.staleLocationThresholdMinutes);
    setEffectiveFrom(snapshot.settings.effectiveFrom);
  }, [snapshot.settings]);
  const openAlerts = snapshot.alerts.filter((item) => !item.acknowledged);
  const save = () => {
    setSaved(false);
    const settings: DemoPolicySettings = { shortageThresholdSeats: shortage, staleLocationThresholdMinutes: stale, effectiveFrom, version: snapshot.settings.version };
    void onAction(async () => { await mockAiAdminApi.saveDemoSettings(settings); setSaved(true); });
  };

  return <div className="ai-tab-stack">
    <div className="ai-section-heading"><div><span className="panel-kicker">FR-13.1–13.3 · NFR-12 / NFR-14</span><h2>التنبيهات والحوكمة والتقارير</h2><p>تنبيهات مرتبة للمراجعة، وإعدادات عرض مؤقتة. الحفظ في هذه الصفحة داخل الذاكرة فقط.</p></div><button className="button button-secondary" onClick={() => exportCsv(snapshot)}><Download size={15} /> تصدير سجل AI التجريبي</button></div>
    <div className="ai-governance-grid">
      <section className="panel ai-alert-panel"><div className="panel-heading"><div><span className="panel-kicker">{openAlerts.length} مفتوح · عينة Mock</span><h2>مركز التنبيهات ذات الأولوية</h2></div><Bell size={17} /></div><div className="ai-alert-list">{snapshot.alerts.map((item) => <article className={`ai-alert-row ${item.priority === 'عاجل' ? 'urgent' : item.priority === 'مرتفع' ? 'high' : ''}`} key={item.id}><span className="ai-alert-priority"><AlertTriangle size={15} /></span><div className="ai-alert-copy"><div><b>{item.title}</b><span className={`ai-priority-label ${item.priority === 'عاجل' ? 'urgent' : ''}`}>{item.priority}</span></div><p>{item.description}</p><small>{item.category} · المصدر: {item.source} · حداثة بيانات العرض: {item.ageLabel} · Demo</small></div>{item.acknowledged ? <span className="ai-acknowledged"><CheckCircle2 size={14} /> تمت القراءة</span> : <button className="button button-quiet button-small" onClick={() => onAction(() => mockAiAdminApi.acknowledgeAlert(item.id))}>تأكيد القراءة (Demo)</button>}</article>)}</div><div className="ai-explanation-note">الموقع القديم لا يُحتسب كعرض متاح حاليًا. التنبيه في التطبيق الفعلي يحتاج عتبة معتمدة ومصدر بيانات حديثًا.</div></section>
      <section className="panel ai-policy-panel"><div className="panel-heading"><div><span className="panel-kicker">UR-A02 · إعدادات ذات تاريخ نفاذ</span><h2>عتبات وقواعد العرض</h2></div><Settings2 size={17} /></div><div className="ai-policy-form"><label><span>عتبة العجز (مقاعد) — Demo</span><input type="number" min="1" max="100" value={shortage} onChange={(event) => setShortage(Number(event.target.value))} /></label><label><span>اعتبار الموقع قديمًا بعد (دقيقة) — Demo</span><input type="number" min="1" max="240" value={stale} onChange={(event) => setStale(Number(event.target.value))} /></label><label><span>تاريخ نفاذ توضيحي</span><input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label><div className="ai-policy-version"><span>الإصدار الحالي</span><b>{snapshot.settings.version}</b></div><button className="button button-primary" onClick={save}><ShieldCheck size={15} /> حفظ في الجلسة التجريبية</button>{saved && <span className="ai-saved-message"><CheckCircle2 size={14} /> حُفظت في ذاكرة العرض فقط، ولم تُرسل إلى Backend.</span>}</div><div className="ai-approval-note">تعريف التعرفة والغرامات والتحفيز النهائي يحتاج موافقة الفريق/المشرف وسجلًا ثابتًا من Backend؛ القيم المعروضة ليست سياسة معتمدة.</div></section>
    </div>

    <section className="panel ai-audit-panel"><div className="panel-heading"><div><span className="panel-kicker">NFR-14 · أثر كل إجراء</span><h2>سجل إجراءات العرض</h2></div><span className="ai-nonproduction-tag"><Clock3 size={13} /> غير دائم</span></div><div className="ai-audit-list">{snapshot.audit.slice(0, 8).map((entry) => <div className="ai-audit-row" key={entry.id}><span className="ai-audit-dot" /><div><b>{entry.action}</b><small>{entry.actor} · {entry.target} · {entry.at}</small><p>{entry.note}</p></div></div>)}</div></section>

    <div className="ai-data-boundary-grid"><div className="ai-data-boundary available"><b>متاح في نموذج العرض</b><span>الطلب، العرض بالمقاعد، التوصية، NLP، مراجعة السلامة والتنبيه.</span></div><div className="ai-data-boundary pending"><b>بانتظار Backend/قرار الفريق</b><span>الدفع ومزود الدفع، الغرامات، التعرفة المعتمدة، حسابات حقيقية ومصدر القياس الفعلي.</span></div></div>
  </div>;
}
