import { useState } from 'react';
import { AlertTriangle, Check, Clock3, Languages, MessageSquareText, ShieldAlert } from 'lucide-react';
import type { FeedbackCase, FeedbackReviewState } from '../../data/aiTypes';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';

type Props = { cases: FeedbackCase[]; onAction: (action: () => Promise<void>) => Promise<void> };
const categoryOptions = ['تجربة رحلة', 'زمن الانتظار', 'سلامة القيادة', 'الازدحام/السعة', 'فئة أخرى'];

function ReviewCard({ item, onAction }: { item: FeedbackCase; onAction: Props['onAction'] }) {
  const [category, setCategory] = useState(item.category);
  const flagged = item.category.includes('سلامة');
  const confidencePercent = Math.round(item.confidence * 100);
  const confidenceLevel = item.confidence < 0.65 ? 'low' : item.confidence < 0.8 ? 'medium' : 'high';
  const review = (state: FeedbackReviewState, corrected?: string) => onAction(() => mockAiAdminApi.reviewFeedback(item.id, state, corrected));
  return <article className={`ai-feedback-card${flagged ? ' flagged' : ''}`}>
    <div className="ai-card-topline"><span className="ai-mini-id">{item.id} · {item.tripId}</span><span className={`ai-state-chip ${item.state.startsWith('تم') ? 'sent' : ''}`}>{item.state}</span></div>
    <div className="ai-feedback-quote">“{item.text}”</div>
    <div className="ai-feedback-meta"><span><Languages size={13} />{item.script}</span><span className="ai-feedback-freshness"><Clock3 size={12} />وقت العينة: {item.createdAt} · Mock</span><span className={`ai-sentiment ${item.sentiment === 'إيجابي' ? 'positive' : item.sentiment === 'سلبي' ? 'negative' : 'neutral'}`}>{item.sentiment}</span></div>
    <div className="ai-classification-grid"><div><span>الفئة الأولية</span><b>{item.category}</b></div><div><span>ثقة التصنيف التوضيحي</span><b>{confidencePercent}٪ <small>Demo · غير معايرة</small></b></div></div>
    <div className={`ai-confidence-meter ${confidenceLevel}`} role="img" aria-label={`مؤشر ثقة توضيحي ${confidencePercent} بالمئة، غير معاير ولا يمثل أداء النموذج`}>
      <div><span>مؤشر الثقة المعروض · Demo فقط</span><b>{confidencePercent}٪</b></div>
      <span className="ai-confidence-track"><i style={{ width: `${confidencePercent}%` }} /></span>
      <small>لا يقيس هذا المؤشر دقة الموديل؛ لا توجد نتائج اختبار مستقلة موصولة.</small>
    </div>
    <div className={`ai-uncertainty-box ${item.confidence < 0.65 ? 'high' : ''}`}><AlertTriangle size={14} /><span><b>عدم اليقين:</b> {item.uncertaintyNote}</span></div>
    {flagged && <div className="ai-safety-flag"><ShieldAlert size={14} /> إشارة سلامة تحتاج تحققًا بشريًا؛ ليست إثباتًا ولا قرار عقوبة.</div>}
    <div className="ai-review-controls"><label><span>فئة المراجع</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label><div className="ai-review-actions"><button className="button button-secondary button-small" onClick={() => review(category === item.category ? 'تم التأكيد تجريبيًا' : 'تم التصحيح تجريبيًا', category)}><Check size={13} />{category === item.category ? 'تأكيد تجريبي' : 'حفظ التصحيح'}</button><button className="button button-quiet button-small" onClick={() => review('تم التصعيد تجريبيًا')}>تصعيد للمراجعة</button></div></div>
  </article>;
}

export function FeedbackTab({ cases, onAction }: Props) {
  const pending = cases.filter((item) => item.state === 'بانتظار المراجعة').length;
  const safetyFlags = cases.filter((item) => item.category.includes('سلامة')).length;
  const franco = cases.filter((item) => item.script === 'Franco-Arabic').length;
  const categorySummary = Object.entries(cases.reduce<Record<string, number>>((totals, item) => {
    totals[item.category] = (totals[item.category] ?? 0) + 1;
    return totals;
  }, {})).sort((left, right) => right[1] - left[1]);
  const maxCategoryCount = Math.max(1, ...categorySummary.map(([, count]) => count));
  const sentimentSummary = (['إيجابي', 'محايد', 'سلبي'] as const).map((sentiment) => ({
    sentiment,
    count: cases.filter((item) => item.sentiment === sentiment).length,
  }));
  return <div className="ai-tab-stack">
    <div className="ai-section-heading"><div><span className="panel-kicker">FR-12.1–12.2 · AIQ-02 · UR-A05</span><h2>تحليل ملاحظات الركاب والشكاوى</h2><p>عرض عربي/Franco-Arabic لمشاعر النص وفئة الشكوى ومؤشر عدم اليقين؛ نتيجة الصفحة محاكاة وليست NLP فعليًا.</p></div><span className="ai-nonproduction-tag"><MessageSquareText size={13} /> بيانات اصطناعية</span></div>
    <div className="ai-feedback-summary"><div><b>{cases.length.toLocaleString('ar-EG')}</b><span>ملاحظات في العينة</span></div><div><b>{pending.toLocaleString('ar-EG')}</b><span>بانتظار مراجعة بشرية</span></div><div><b>{franco.toLocaleString('ar-EG')}</b><span>نصوص Franco-Arabic</span></div><div><b>{safetyFlags.toLocaleString('ar-EG')}</b><span>إشارات سلامة للفرز</span></div></div>
    <div className="ai-feedback-patterns">
      <section className="ai-pattern-card" aria-label="توزيع فئات الملاحظات في العينة التجريبية">
        <div className="ai-pattern-heading"><div><span className="panel-kicker">تجميع محلي · Demo</span><h3>أنماط الشكاوى في العينة</h3></div><span>ليست إحصاءات إنتاجية</span></div>
        <div className="ai-pattern-list">{categorySummary.map(([category, count]) => <div className="ai-pattern-row" key={category}><span>{category}</span><span className="ai-pattern-track"><i style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></span><b>{count}</b></div>)}</div>
      </section>
      <section className="ai-pattern-card ai-sentiment-card" aria-label="توزيع المشاعر في العينة التجريبية">
        <div className="ai-pattern-heading"><div><span className="panel-kicker">مشاعر النص · Demo</span><h3>التوزيع الأولي</h3></div></div>
        <div className="ai-pattern-sentiments">{sentimentSummary.map(({ sentiment, count }) => <span className={`ai-pattern-sentiment ${sentiment === 'سلبي' ? 'negative' : sentiment === 'إيجابي' ? 'positive' : ''}`} key={sentiment}><span>{sentiment}</span><b>{count}</b></span>)}</div>
      </section>
    </div>
    <div className="ai-evaluation-strip"><AlertTriangle size={15} /><span>مقاييس Precision / Recall / Macro-F1 غير متاحة: لا توجد بيانات معنونة واختبارات held-out موصولة. لا تعتبر قيمة الثقة في البطاقات أداءً للموديل.</span></div>
    <div className="ai-feedback-grid">{cases.map((item) => <ReviewCard key={item.id} item={item} onAction={onAction} />)}</div>
    <div className="ai-explanation-note"><b>ضابط خصوصية:</b> لا تعرض بيانات الراكب الحقيقية إلا للمشرف المخوّل، وتطبق موافقة ومدة احتفاظ محدودة على نصوص الملاحظات في النظام الفعلي.</div>
  </div>;
}
