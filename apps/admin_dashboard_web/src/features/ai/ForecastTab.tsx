import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowLeft, Check, Clock3, MapPin, Send, Users } from 'lucide-react';
import type { AIAdminSnapshot, ReallocationRecommendation } from '../../data/aiTypes';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';

type Props = { snapshot: AIAdminSnapshot; onAction: (action: () => Promise<void>) => Promise<void> };

function RecommendationCard({ row, onAction }: { row: ReallocationRecommendation; onAction: Props['onAction'] }) {
  const sent = row.state !== 'مقترحة';
  return <article className="ai-recommend-card">
    <div className="ai-card-topline"><span className="ai-mini-id">{row.id}</span><span className={`ai-state-chip ${sent ? 'sent' : ''}`}>{row.state}</span></div>
    <div className="ai-recommend-route"><span className="ai-driver-badge"><Users size={16} /></span><div><b>{row.driverName}</b><small>{row.driverId} · {row.compatibleRoute}</small></div></div>
    <div className="ai-route-shift"><span>{row.fromArea}</span><ArrowLeft size={15} /><strong>{row.targetArea}</strong><small>{row.timeWindow}</small></div>
    <div className="ai-recommend-facts"><span><b>{row.gapBeforeSeats}</b><small>عجز قبل</small></span><span><b>{row.freeSeatsAfterMove}</b><small>مقاعد متوقعة</small></span><span><b>{row.residualGapSeats}</b><small>فجوة متبقية</small></span><span><b>{row.incentiveEgp} ج.م</b><small>عرض Demo</small></span></div>
    <p className="ai-recommend-rationale">{row.rationale}</p>
    <div className="ai-eligibility-list">{row.eligibility.map((condition) => <span key={condition}><Check size={12} />{condition}</span>)}</div>
    <div className="ai-card-actions">
      {row.state === 'مقترحة' && <button className="button button-primary button-small" onClick={() => onAction(() => mockAiAdminApi.setRecommendationState(row.id, 'مرسلة تجريبيًا'))}><Send size={13} /> محاكاة إرسال العرض</button>}
      {row.state === 'مرسلة تجريبيًا' && <><button className="button button-secondary button-small" onClick={() => onAction(() => mockAiAdminApi.setRecommendationState(row.id, 'قبول تجريبي'))}>محاكاة قبول السائق</button><button className="button button-quiet button-small" onClick={() => onAction(() => mockAiAdminApi.setRecommendationState(row.id, 'رفض تجريبي'))}>محاكاة رفض السائق</button></>}
      {(row.state === 'قبول تجريبي' || row.state === 'رفض تجريبي') && <span className="ai-readonly-result">رد محاكى — لا يوجد اتصال بتطبيق السائق</span>}
    </div>
  </article>;
}

export function ForecastTab({ snapshot, onAction }: Props) {
  const [showAll, setShowAll] = useState(false);
  const chartData = snapshot.forecasts.map((item) => ({ area: item.area, 'الطلب المتوقع': item.predictedRequests, 'المقاعد الحرة المقدرة': item.estimatedFreeSeats }));
  const visible = showAll ? snapshot.forecasts : snapshot.forecasts.slice(0, 4);
  const alerts = snapshot.forecasts.filter((item) => item.gapSeats > 0 || item.supplyAgeMinutes > snapshot.settings.staleLocationThresholdMinutes);

  return <div className="ai-tab-stack">
    <div className="ai-section-heading"><div><span className="panel-kicker">FR-9 / FR-10 · نموذج عرض</span><h2>توقع الطلب ومقارنة المقاعد المتاحة</h2><p>القيم التالية للتوضيح فقط. لا يوجد موديل تنبؤ أو بيانات مقاعد/GPS حقيقية موصولة.</p></div><span className="ai-freshness-pill"><Clock3 size={14} /> حداثة المصدر: {snapshot.model.snapshotAt}</span></div>
    <div className="ai-feature-grid">
      <section className="panel ai-chart-panel"><div className="panel-heading"><div><span className="panel-kicker">عدد رحلات/مقاعد توضيحي</span><h2>الطلب المتوقع مقابل العرض بالمقاعد</h2></div><span className="ai-nonproduction-tag">Demo data</span></div>
        <div className="ai-chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 5, left: -16, bottom: 0 }}><defs><linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#118a88" stopOpacity={0.2} /><stop offset="95%" stopColor="#118a88" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f4" strokeDasharray="3 5" /><XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fill: '#718894', fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#82909b', fontSize: 10 }} /><Tooltip contentStyle={{ border: '1px solid #e7edf0', borderRadius: 12, direction: 'rtl', fontFamily: 'inherit', fontSize: 11 }} /><Legend align="right" verticalAlign="top" height={38} iconType="circle" /><Area type="monotone" dataKey="الطلب المتوقع" stroke="#0d8587" fill="url(#forecastArea)" strokeWidth={2.5} /><Area type="monotone" dataKey="المقاعد الحرة المقدرة" stroke="#6487ce" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        <div className="ai-evaluation-strip"><AlertTriangle size={15} /><span>اختبار AIQ-03 غير متاح: لا يوجد MAE/RMSE على فترة اختبار مستقلة ولا مقارنة فعلية بخط أساس المتوسط التاريخي.</span></div>
      </section>
      <aside className="panel ai-model-card"><span className="ai-model-orbit"><MapPin size={21} /></span><span className="panel-kicker">نسخة الموديل</span><strong>{snapshot.model.version}</strong><span className="ai-disconnected-badge">غير متصل</span><p>التوقع حسب المنطقة والفترة يجب أن يعتمد على سجل الرحلات والجغرافيا والخصائص الزمنية.</p><div className="ai-model-card-footer"><span>حالة التقييم</span><b>لم يتم التقييم</b></div><div className="ai-model-card-footer"><span>مصدر الإحداثيات</span><b>عينة محلية</b></div></aside>
    </div>

    <section className="panel ai-forecast-table-panel"><div className="panel-heading"><div><span className="panel-kicker">FR-10.1 / FR-10.2</span><h2>العجز والفائض على مستوى المقاعد</h2></div><span className="chart-period">العتبة التجريبية: {snapshot.settings.shortageThresholdSeats} مقاعد</span></div>
      <div className="ai-forecast-list">{visible.map((item) => {
        const stale = item.supplyAgeMinutes > snapshot.settings.staleLocationThresholdMinutes;
        return <article className="ai-forecast-row" key={item.id}>
          <div className="ai-area-cell"><span className="ai-area-icon"><MapPin size={15} /></span><span><b>{item.area}</b><small>{item.routeName}</small></span></div>
          <span className="ai-period-cell">{item.window}</span>
          <div className="ai-number-cell"><b>{item.predictedRequests}</b><small>طلب متوقع · Demo</small><small className="ai-range">نطاق التوقع {item.lowerBound}–{item.upperBound}</small><small className="ai-uncertainty-copy"><AlertTriangle size={10} />عدم اليقين: {item.confidenceLabel}</small></div>
          <div className="ai-number-cell"><b>{item.estimatedFreeSeats}</b><small>مقعد متاح · Demo</small></div>
          <span className={`ai-gap-pill ${item.gapSeats > 0 ? 'shortage' : 'surplus'}`}>{item.gapSeats > 0 ? `عجز ${item.gapSeats}` : `فائض ${Math.abs(item.gapSeats)}`} مقعد</span>
          <span className={`ai-age-pill ${stale ? 'stale' : ''}`} title="عمر لقطة العرض التجريبية؛ ليس عمر GPS حقيقي"><Clock3 size={12} />عمر بيانات العرض {item.supplyAgeMinutes} د · {stale ? 'قديم' : 'Demo'}</span>
        </article>;
      })}</div>
      {snapshot.forecasts.length > 4 && <button className="button button-quiet ai-show-more" onClick={() => setShowAll((value) => !value)}>{showAll ? 'عرض أقل' : 'عرض كل المناطق'}</button>}
      <div className="ai-explanation-note"><b>مهم:</b> العرض يُقاس بمقاعد حرة وليس بعدد المركبات وحده. السجلات القديمة أو غير المتاحة لا يجوز احتسابها كعرض حالي. النطاق ومؤشر عدم اليقين أعلاه توضيحيان وغير مُعايرين.</div>
    </section>

    <div className="ai-section-heading ai-recommend-heading"><div><span className="panel-kicker">FR-11.1–11.3 · التوصية طوعية</span><h2>اقتراحات نقل السائقين والحوافز</h2><p>عرض الأهلية والفجوة المتبقية وتسجيل رد السائق كمحاكاة محلية فقط.</p></div><span className="ai-nonproduction-tag">لا يتم تحريك سائق فعليًا</span></div>
    <div className="ai-recommend-grid">{snapshot.recommendations.map((row) => <RecommendationCard key={row.id} row={row} onAction={onAction} />)}</div>
    {alerts.length > 0 && <div className="ai-footnote-card"><AlertTriangle size={15} /><span>{alerts.length} تنبيه/تنبيهات توضيحية مرتبطة بالعجز أو بحداثة الموقع. راجع تبويب «التنبيهات والحوكمة».</span></div>}
  </div>;
}
