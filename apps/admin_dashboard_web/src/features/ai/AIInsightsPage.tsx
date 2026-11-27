import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, BrainCircuit, Clock3, MessageSquareText, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { MetricCard } from '../../components/MetricCard';
import { ErrorState, LoadingState, PageHeading } from '../../components/ui';
import { mockAiAdminApi } from '../../data/mockAiAdminApi';
import type { AIAdminSnapshot } from '../../data/aiTypes';
import { useMockResource } from '../../hooks/useMockResource';
import { AssistantTab } from './AssistantTab';
import { FeedbackTab } from './FeedbackTab';
import { ForecastTab } from './ForecastTab';
import { GovernanceTab } from './GovernanceTab';
import { SafetyTab } from './SafetyTab';

const tabs = [
  { key: 'forecast', label: 'الطلب والحوافز', icon: Activity },
  { key: 'feedback', label: 'NLP والشكاوى', icon: MessageSquareText },
  { key: 'safety', label: 'سلامة السائقين', icon: ShieldCheck },
  { key: 'assistant', label: 'مساعد النقل', icon: Sparkles },
  { key: 'governance', label: 'التنبيهات والحوكمة', icon: AlertTriangle },
] as const;

type TabKey = (typeof tabs)[number]['key'];
type RunAction = (action: () => Promise<void>) => Promise<void>;

function isTabKey(value: string | null): value is TabKey {
  return tabs.some((tab) => tab.key === value);
}

export function AIInsightsPage() {
  const loader = useCallback(() => mockAiAdminApi.getSnapshot(), []);
  const { data, loading, error, reload } = useMockResource<AIAdminSnapshot>(loader);
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionError, setActionError] = useState('');
  const currentTab = isTabKey(searchParams.get('tab')) ? searchParams.get('tab') as TabKey : 'forecast';

  const selectTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
    setActionError('');
  };

  const runAction: RunAction = async (action) => {
    setActionError('');
    try {
      await action();
      reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'تعذر تنفيذ الإجراء التجريبي.');
    }
  };

  const pendingFeedback = data?.feedback.filter((item) => item.state === 'بانتظار المراجعة').length ?? 0;
  const pendingSafety = data?.safetyCases.filter((item) => item.state === 'تحتاج مراجعة بشرية').length ?? 0;
  const openAlerts = data?.alerts.filter((item) => !item.acknowledged).length ?? 0;
  const shortageAreas = data?.forecasts.filter((item) => item.gapSeats > 0).length ?? 0;

  return <>
    <PageHeading title="ذكاء التشغيل" subtitle="التنبؤ بالطلب ومراجعة الإشارات والمساعد الإداري — كلها في وضع عرض تجريبي حتى ربط خدمات الفريق." icon={<BrainCircuit size={18} />} actions={<button className="button button-secondary" onClick={reload}><RefreshCw size={15} /> تحديث العينة</button>} />

    <div className="ai-demo-banner" role="status">
      <span className="ai-demo-banner-icon"><BrainCircuit size={18} /></span>
      <div><strong>محاكاة فقط — لا يوجد موديل ML أو NLP أو LLM متصل</strong><p>الإحداثيات والتوقعات والتصنيفات والدرجات قيم عرض غير إنتاجية. لا ترسل هذه الشاشة عروضًا حقيقية ولا تطبق عقوبات أو قرارات.</p></div>
      <span className="ai-model-chip"><i /> {data?.model.version ?? 'DEMO-0.1'}</span>
    </div>

    <div className="ai-metrics-grid">
      <MetricCard title="مناطق بعجز مقاعد" value={loading ? '—' : shortageAreas.toLocaleString('ar-EG')} note="توضيحي · من عينة Forecast" icon={<Activity size={18} />} accent="amber" />
      <MetricCard title="ملاحظات تنتظر المراجعة" value={loading ? '—' : pendingFeedback.toLocaleString('ar-EG')} note="تصنيف NLP غير موصول" icon={<MessageSquareText size={18} />} accent="blue" />
      <MetricCard title="حالات سلامة للمراجعة" value={loading ? '—' : pendingSafety.toLocaleString('ar-EG')} note="لا ينتج عنها إجراء آلي" icon={<ShieldCheck size={18} />} accent="violet" />
      <MetricCard title="تنبيهات العرض المفتوحة" value={loading ? '—' : openAlerts.toLocaleString('ar-EG')} note="Mock · لا تُرسل إشعارات" icon={<Users size={18} />} accent="teal" />
    </div>

    <div className="ai-model-status-row">
      <span className="ai-status-dot" /> <b>حالة الخدمة:</b> {data?.model.connection ?? 'غير متصل'}
      <span className="ai-freshness-mark"><Clock3 size={13} /><b>حداثة البيانات:</b> {data?.model.snapshotAt ?? 'غير متاح'}</span>
      <span className="ai-status-divider" /> <b>التقييم:</b> {data?.model.evaluationStatus ?? 'جارٍ التحميل'}
      <span className="ai-status-note">{data?.model.evaluationNote}</span>
    </div>

    <div className="ai-tab-bar" role="tablist" aria-label="وحدات الذكاء الاصطناعي">
      {tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" role="tab" aria-selected={currentTab === key} className={currentTab === key ? 'active' : ''} onClick={() => selectTab(key)}><Icon size={16} /><span>{label}</span></button>)}
    </div>

    {actionError && <div className="inline-error" role="alert"><span>{actionError}</span><button onClick={() => setActionError('')}>إغلاق</button></div>}
    {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingState label="جارٍ تحميل بيانات العرض…" /> : data && <div className="ai-tab-content" role="tabpanel">
      {currentTab === 'forecast' && <ForecastTab snapshot={data} onAction={runAction} />}
      {currentTab === 'feedback' && <FeedbackTab cases={data.feedback} onAction={runAction} />}
      {currentTab === 'safety' && <SafetyTab cases={data.safetyCases} onAction={runAction} />}
      {currentTab === 'assistant' && <AssistantTab onRefresh={reload} />}
      {currentTab === 'governance' && <GovernanceTab snapshot={data} onAction={runAction} />}
    </div>}
    <p className="ai-page-footnote">مصدر هذه الصفحة: بيانات Demo محلية قابلة لإعادة الضبط. عند جاهزية Backend تُستبدل دوال <code>mockAiAdminApi</code> بعقود API المتفق عليها، ولا يتصل React بقاعدة البيانات مباشرة.</p>
  </>;
}
