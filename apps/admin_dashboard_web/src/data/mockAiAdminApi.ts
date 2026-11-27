import type {
  AIAdminSnapshot,
  AIAuditEntry,
  AgentReply,
  DemoPolicySettings,
  FeedbackReviewState,
  RecommendationState,
  SafetyReviewState,
} from './aiTypes';

const initialSnapshot: AIAdminSnapshot = {
  model: {
    version: 'DEMO-0.1',
    connection: 'غير متصل',
    evaluationStatus: 'لا يوجد تقييم موديل موصول',
    evaluationNote: 'لا تُعرض أي دقة أو نتيجة فعلية قبل اختبار بيانات held-out ومقارنتها بخط الأساس المعتمد.',
    snapshotAt: 'عينة محلية ثابتة · لا تحديث حي',
  },
  forecasts: [
    { id: 'FC-01', area: 'سموحة', routeName: 'سموحة – محطة الرمل', window: '١٥:٠٠–١٦:٠٠', predictedRequests: 34, estimatedFreeSeats: 20, lowerBound: 28, upperBound: 41, gapSeats: 14, supplyAgeMinutes: 4, modelVersion: 'DEMO-0.1', confidenceLabel: 'نطاق توضيحي' },
    { id: 'FC-02', area: 'سيدي جابر', routeName: 'سيدي جابر – المنشية', window: '١٥:٠٠–١٦:٠٠', predictedRequests: 27, estimatedFreeSeats: 31, lowerBound: 21, upperBound: 34, gapSeats: -4, supplyAgeMinutes: 8, modelVersion: 'DEMO-0.1', confidenceLabel: 'نطاق توضيحي' },
    { id: 'FC-03', area: 'العصافرة', routeName: 'العصافرة – المنشية', window: '١٥:٠٠–١٦:٠٠', predictedRequests: 39, estimatedFreeSeats: 24, lowerBound: 31, upperBound: 48, gapSeats: 15, supplyAgeMinutes: 11, modelVersion: 'DEMO-0.1', confidenceLabel: 'نطاق توضيحي' },
    { id: 'FC-04', area: 'محطة الرمل', routeName: 'سيدي جابر – المنشية', window: '١٦:٠٠–١٧:٠٠', predictedRequests: 22, estimatedFreeSeats: 28, lowerBound: 18, upperBound: 27, gapSeats: -6, supplyAgeMinutes: 7, modelVersion: 'DEMO-0.1', confidenceLabel: 'نطاق توضيحي' },
    { id: 'FC-05', area: 'المنشية', routeName: 'العصافرة – المنشية', window: '١٦:٠٠–١٧:٠٠', predictedRequests: 31, estimatedFreeSeats: 18, lowerBound: 24, upperBound: 38, gapSeats: 13, supplyAgeMinutes: 92, modelVersion: 'DEMO-0.1', confidenceLabel: 'نطاق توضيحي' },
  ],
  recommendations: [
    { id: 'RC-01', driverId: 'DR-1103', driverName: 'مصطفى السيد', compatibleRoute: 'العصافرة – المنشية', fromArea: 'ميامي', targetArea: 'العصافرة', timeWindow: '١٥:٠٠–١٦:٠٠', freeSeatsAfterMove: 8, gapBeforeSeats: 15, residualGapSeats: 7, incentiveEgp: 12, eligibility: ['المسار متوافق', 'الحساب نشط', 'التوفر اختياري'], rationale: 'تقليل عجز المقاعد المتوقع مع الحفاظ على فجوة متبقية ظاهرة.', state: 'مقترحة' },
    { id: 'RC-02', driverId: 'DR-1205', driverName: 'ياسر فتحي', compatibleRoute: 'سموحة – محطة الرمل', fromArea: 'سيدي جابر', targetArea: 'سموحة', timeWindow: '١٥:٠٠–١٦:٠٠', freeSeatsAfterMove: 6, gapBeforeSeats: 14, residualGapSeats: 8, incentiveEgp: 10, eligibility: ['المسار متوافق', 'التقييم يستلزم مراجعة بيانات فعلية', 'التوفر اختياري'], rationale: 'اقتراح عرض تجريبي لسائق قريب؛ الأهلية النهائية يحددها Backend وفق القواعد المعتمدة.', state: 'مرسلة تجريبيًا' },
    { id: 'RC-03', driverId: 'DR-1042', driverName: 'أحمد محمد', compatibleRoute: 'سيدي جابر – المنشية', fromArea: 'سبورتنج', targetArea: 'سيدي جابر', timeWindow: '١٦:٠٠–١٧:٠٠', freeSeatsAfterMove: 5, gapBeforeSeats: 9, residualGapSeats: 4, incentiveEgp: 8, eligibility: ['المسار متوافق', 'عرض توضيحي غير معتمد'], rationale: 'العينة توضح حساب الفجوة المتبقية؛ لا توجد توصية تشغيلية حقيقية.', state: 'مقترحة' },
  ],
  feedback: [
    { id: 'FB-01', tripId: 'TR-9021', passengerLabel: 'راكب تجريبي', text: 'السواق كان محترم والرحلة كانت مريحة جدًا.', script: 'عربي مصري', sentiment: 'إيجابي', category: 'تجربة رحلة', confidence: 0.88, uncertaintyNote: 'قد يتداخل الرضا العام مع تقييم زمن الانتظار.', createdAt: 'اليوم · ١٤:١٢', state: 'بانتظار المراجعة' },
    { id: 'FB-02', tripId: 'TR-9018', passengerLabel: 'راكب تجريبي', text: 'El entezar kan taweel w el mashwar tamam.', script: 'Franco-Arabic', sentiment: 'محايد', category: 'زمن الانتظار', confidence: 0.63, uncertaintyNote: 'تهجئة Franco-Arabic قد تحمل أكثر من معنى؛ يلزم انتباه المراجع.', createdAt: 'اليوم · ١٣:٤٧', state: 'بانتظار المراجعة' },
    { id: 'FB-03', tripId: 'TR-9017', passengerLabel: 'راكب تجريبي', text: 'السواق عدى الإشارة بسرعة وده خوّفني.', script: 'عربي مصري', sentiment: 'سلبي', category: 'سلامة القيادة', confidence: 0.71, uncertaintyNote: 'تصنيف السلامة مؤشر فرز أولي وليس إثباتًا للواقعة.', createdAt: 'اليوم · ١٢:٥٩', state: 'بانتظار المراجعة' },
    { id: 'FB-04', tripId: 'TR-9015', passengerLabel: 'راكب تجريبي', text: 'el microbus kan zahma bas el safar saree3.', script: 'Franco-Arabic', sentiment: 'سلبي', category: 'الازدحام/السعة', confidence: 0.54, uncertaintyNote: 'ثقة منخفضة؛ النص لا يحسم إن كانت الشكوى من المركبة أم الطريق.', createdAt: 'أمس · ١٨:٢١', state: 'بانتظار المراجعة' },
  ],
  safetyCases: [
    { id: 'SF-01', driverId: 'DR-1134', driverName: 'إبراهيم علي', scoreDemo: 82, scoreScaleNote: 'مؤشر واجهة ٠–١٠٠ غير مُعاير وغير معتمد', snapshotAt: 'اليوم · ١٣:٥٠', uncertainty: 'متوسط · مثال فقط', factors: [{ label: 'تقييمات الرحلات', description: 'عينة توضيحية من التقييمات المرتبطة برحلات مكتملة.', source: 'Mock feedback' }, { label: 'بيانات حركة أثناء الوردية', description: 'لا تتضمن هذه النسخة بيانات GPS حقيقية.', source: 'غير متصل' }], reviewReason: 'طلب مراجعة بلاغ سلامة قبل أي استنتاج.', state: 'تحتاج مراجعة بشرية' },
    { id: 'SF-02', driverId: 'DR-1088', driverName: 'محمود إبراهيم', scoreDemo: 91, scoreScaleNote: 'مؤشر واجهة ٠–١٠٠ غير مُعاير وغير معتمد', snapshotAt: 'أمس · ١٦:١٥', uncertainty: 'مرتفع · أدلة غير متاحة', factors: [{ label: 'التقييمات', description: 'عرض تجريبي؛ يلزم التحقق من رحلة وملاحظاتها.', source: 'Mock feedback' }], reviewReason: 'مصدر إشارة غير موصول؛ لا تُعامل الحالة كواقعة مؤكدة.', state: 'تحتاج مراجعة بشرية' },
    { id: 'SF-03', driverId: 'DR-1297', driverName: 'زياد طارق', scoreDemo: 96, scoreScaleNote: 'مؤشر واجهة ٠–١٠٠ غير مُعاير وغير معتمد', snapshotAt: '٢٨ أكتوبر · ١١:٠٠', uncertainty: 'متوسط · مثال فقط', factors: [{ label: 'اكتمال الرحلات', description: 'قيمة إيضاحية وليست عامل سلامة مُعتمدًا.', source: 'Mock trips' }], reviewReason: 'توضيح أن المؤشر لا يستند إلى تقييم إنتاجي.', state: 'اكتملت المراجعة التجريبية' },
  ],
  alerts: [
    { id: 'AL-01', priority: 'عاجل', category: 'فجوة مقاعد', title: 'عجز مقاعد توضيحي في العصافرة', description: 'الفجوة التجريبية ١٥ مقعدًا في نافذة ١٥:٠٠–١٦:٠٠.', source: 'FC-03 · DEMO', ageLabel: 'توضيحي', acknowledged: false },
    { id: 'AL-02', priority: 'مرتفع', category: 'حداثة بيانات', title: 'بيانات موقع قديمة في المنشية', description: 'آخر عينة للموقع منذ ٩٢ دقيقة؛ لا تستخدم كعرض حالي.', source: 'FC-05 · موقع تجريبي', ageLabel: '٩٢ دقيقة · عينة', acknowledged: false },
    { id: 'AL-03', priority: 'مرتفع', category: 'سلامة', title: 'إشارة سلامة تحتاج مراجعة بشرية', description: 'ملاحظة مصنفة تجريبيًا؛ لا تثبت مخالفة ولا تنشئ عقوبة.', source: 'FB-03 · تصنيف غير موصول', ageLabel: 'اليوم · عينة', acknowledged: false },
    { id: 'AL-04', priority: 'متوسط', category: 'مراجعة شكوى', title: 'تقييم Franco-Arabic منخفض الثقة', description: 'يلزم مراجع بشري قبل اعتماد فئة الشكوى.', source: 'FB-04 · DEMO', ageLabel: 'أمس · عينة', acknowledged: true },
  ],
  audit: [
    { id: 'AU-01', action: 'فتح مراجعة عرض', actor: 'مشرف تجريبي', target: 'RC-02', at: 'اليوم · ١٤:٠٥', note: 'حالة محاكاة؛ لم يُرسل إشعار لسائق فعلي.' },
    { id: 'AU-02', action: 'تسجيل قراءة تجريبية', actor: 'مشرف تجريبي', target: 'DEMO-0.1', at: 'اليوم · ١٣:٤٥', note: 'السجل محلي في ذاكرة الصفحة فقط.' },
  ],
  settings: { shortageThresholdSeats: 8, staleLocationThresholdMinutes: 15, effectiveFrom: '2026-11-01', version: 'DEMO-POLICY-01' },
};

let snapshot = structuredClone(initialSnapshot);
let auditSequence = 3;
const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T,>(value: T): T => structuredClone(value);

function addAudit(action: string, target: string, note: string) {
  const entry: AIAuditEntry = {
    id: `AU-${String(auditSequence++).padStart(2, '0')}`,
    action,
    actor: 'مشرف تجريبي',
    target,
    at: 'الآن · جلسة محلية',
    note,
  };
  snapshot.audit = [entry, ...snapshot.audit];
}

export const mockAiAdminApi = {
  async getSnapshot(): Promise<AIAdminSnapshot> {
    await delay();
    return clone(snapshot);
  },

  async setRecommendationState(id: string, state: RecommendationState): Promise<void> {
    await delay(180);
    const row = snapshot.recommendations.find((item) => item.id === id);
    if (!row) throw new Error('التوصية غير موجودة في عينة العرض.');
    const before = row.state;
    row.state = state;
    addAudit('تغيير حالة توصية تجريبية', id, `${before} ← ${state}. لم يحدث إرسال أو تحريك فعلي.`);
  },

  async reviewFeedback(id: string, state: FeedbackReviewState, category?: string): Promise<void> {
    await delay(180);
    const row = snapshot.feedback.find((item) => item.id === id);
    if (!row) throw new Error('الملاحظة غير موجودة في عينة العرض.');
    const before = row.category;
    if (category) row.category = category;
    row.state = state;
    addAudit('مراجعة NLP تجريبية', id, category && category !== before ? `تصحيح فئة: ${before} ← ${category}.` : `قرار المراجع: ${state}.`);
  },

  async reviewSafety(id: string, state: SafetyReviewState, note: string): Promise<void> {
    await delay(180);
    const row = snapshot.safetyCases.find((item) => item.id === id);
    if (!row) throw new Error('حالة السلامة غير موجودة في عينة العرض.');
    row.state = state;
    addAudit('مراجعة سلامة بشرية تجريبية', id, `${state}. ${note || 'لا توجد ملاحظة إضافية.'} لا تنشئ هذه العملية عقوبة.`);
  },

  async acknowledgeAlert(id: string): Promise<void> {
    await delay(160);
    const row = snapshot.alerts.find((item) => item.id === id);
    if (!row) throw new Error('التنبيه غير موجود في عينة العرض.');
    row.acknowledged = true;
    addAudit('تأكيد قراءة تنبيه تجريبي', id, row.title);
  },

  async saveDemoSettings(settings: DemoPolicySettings): Promise<void> {
    await delay(180);
    snapshot.settings = { ...settings, version: `DEMO-POLICY-${String(auditSequence).padStart(2, '0')}` };
    addAudit('حفظ عتبات تجريبية', snapshot.settings.version, `نافذة عينة تبدأ ${settings.effectiveFrom}. لم تُحفظ في Backend.`);
  },

  async askAgent(question: string): Promise<AgentReply> {
    await delay(420);
    const q = question.toLowerCase();
    let reply: AgentReply;
    if (/غرامة|عقوبة|خصم|ايقاف|إيقاف|تحصيل|ادفع|دفع/.test(q)) {
      reply = {
        text: 'لا أستطيع إصدار أو اعتماد عقوبة أو دفعة. أستطيع فقط تلخيص بيانات مصرح بها؛ أي قرار مالي أو إجراء سلبي يحتاج مراجعة وتأكيدًا من مسؤول مخوّل وفق سياسة معتمدة.',
        sources: ['سياسة صلاحيات المساعد التجريبية'],
        toolsUsed: ['لا توجد أداة تنفيذ'],
        freshness: 'مصدر إرشادي ثابت في الواجهة',
        uncertainty: 'لا يوجد قرار تشغيلي أو تحقق من Backend.',
        abstained: true,
      };
    } else if (/حافز|حوافز|توصي|توصية|إعادة توزيع|اعادة توزيع/.test(q)) {
      reply = {
        text: 'في بيانات العرض، يوجد اقتراح واحد قرب سموحة بعرض توضيحي قدره ١٠ ج.م. الاستحقاق والمسار والفجوة تقديرات Mock فقط؛ لا يُرسل العرض للسائق من هذه الشاشة.',
        sources: ['جدول التوصيات RC-02', 'بيانات فجوة المقاعد DEMO'],
        toolsUsed: ['ملخص توصيات الحوافز التجريبي'],
        freshness: 'عينة محلية غير مباشرة',
        uncertainty: 'مرتفع؛ لا يوجد موديل أو GPS أو بيانات مقاعد فعلية موصولة.',
        abstained: false,
      };
    } else if (/طلب|زحم|منطقة|مناطق|توقع|طلب/.test(q)) {
      reply = {
        text: 'بحسب عينة العرض، تظهر سموحة والعصافرة كمنطقتين بهما فجوة مقاعد توضيحية في نافذة ١٥:٠٠–١٦:٠٠. لا تعتبر هذه توقعات حقيقية؛ يلزم موديل مُقيّم وبيانات حديثة قبل أي تشغيل.',
        sources: ['توقعات DEMO-0.1', 'حساب فجوة المقاعد التوضيحي'],
        toolsUsed: ['ملخص التنبؤ التجريبي'],
        freshness: 'آخر عينة Demo ثابتة',
        uncertainty: 'مرتفع؛ هذه الرسالة نموذج توضيحي وليست إجابة مولدة من LLM.',
        abstained: false,
      };
    } else if (/سائق|سلامة|شكوى|تقييم|سائقين/.test(q)) {
      reply = {
        text: 'أستطيع تلخيص الحالات التجريبية المعروضة فقط. توجد حالة سلامة تحتاج مراجعة بشرية وملاحظة عربية/Franco-Arabic غير مؤكدة. التصنيف لا يثبت الواقعة ولا يبرر عقوبة بمفرده.',
        sources: ['قائمة مراجعة السلامة SF-01', 'عينة ملاحظات FB-03 وFB-04'],
        toolsUsed: ['ملخص سلامة وNLP تجريبي'],
        freshness: 'عينة محلية غير مباشرة',
        uncertainty: 'مرتفع؛ لا يوجد NLP أو سجل أمان فعلي موصول.',
        abstained: false,
      };
    } else {
      reply = {
        text: 'لا أملك دليلًا كافيًا للإجابة عن هذا السؤال في بيانات العرض. اسأل عن فجوة الطلب أو الحوافز أو مراجعات الشكاوى التجريبية، أو انتظر ربط الخدمات المصرح بها.',
        sources: [],
        toolsUsed: ['لم يتم استدعاء أي أداة'],
        freshness: 'لا توجد بيانات مسترجعة',
        uncertainty: 'مرتفع؛ الامتناع أفضل من اختلاق معلومة.',
        abstained: true,
      };
    }
    addAudit('سؤال إلى المساعد التجريبي', 'AI Agent Demo', `سؤال عينة: ${question.slice(0, 120)} · الأدوات: ${reply.toolsUsed.join('، ')} · امتنع: ${reply.abstained ? 'نعم' : 'لا'}.`);
    return clone(reply);
  },
};
