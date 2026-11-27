# عقد وحدات Admin الذكية والربط المقترح بـAPI/Database

> هذه الوثيقة تجمع ما تنفذه واجهة العرض وما يحتاجه تكامل الفريق. مسارات API والـJSON أدناه مقترحات قابلة للتعديل عند اتفاق Backend؛ ليست تصميمًا نهائيًا مفروضًا. شاشات ML/NLP/LLM كلها Mock الآن ولا تُنتج نتيجة علمية أو قرار تشغيل.

## 1. كيف يتصل Admin ببقية النظام؟

```text
لوحة Admin (React) ── HTTP/JSON ── Backend API ── PostgreSQL
                                         │
                                         ├── Driver App (Flutter)
                                         ├── Passenger App (Flutter)
                                         ├── خدمة Forecast / NLP / Safety
                                         └── مزود خرائط/دفع عند اعتماده
```

السائق والراكب وAdmin يتعاملون مع **نفس الكيانات الأساسية** وقاعدة بيانات النظام، لكن لكل تطبيق واجهات وصلاحيات مختلفة. Admin ليس قاعدة بيانات أخرى، وReact لا يحتفظ بكلمة مرور PostgreSQL ولا يفتح اتصال SQL. الـBackend يتحقق من المستخدم والدور والمدخلات وقواعد العمل ثم يقرأ/يكتب في قاعدة البيانات.

## 2. ما اكتمل في واجهة Admin الآن؟

- مركز تشغيل بواجهة RTL، وحدات السائقين والركاب والطلبات والرحلات والمسارات والمحطات والخريطة والتقارير.
- خريطة إسكندرية جغرافية بـMapLibre فوق OpenFreeMap/بيانات OpenStreetMap. طبقات الخريطة تعمل بمواقع Mock اصطناعية؛ لا يوجد اتصال GPS حي.
- صفحة **ذكاء التشغيل** بتبويبات للتوقع/الحوافز، مراجعة NLP، السلامة، مساعد المشرف، والتنبيهات والحوكمة.
- جداول وعمليات العرض تحتفظ بحالتها في الذاكرة فقط. عروض AI توضح «غير متصل» و`DEMO-0.1` وتمنع فهم نتائجها على أنها موديل فعلي.
- صفحة التقارير تفصل ما هو محسوب من سجل العينة عما لم يتصل بعد: التعرفة والمدفوعات والغرامات وتقييم ML.
- استثناء تدريبي موجود: `src/data/adminHttpApi.ts` يقرأ قائمة السائقين من `GET {VITE_API_BASE_URL}/admin/drivers` فقط. يتقبل مصفوفة مباشرة أو `{ "data": [...] }`. إن لم يضبط عنوان API يستخدم بيانات Mock؛ إن ضبط وفشل الطلب يعرض خطأ ولا يخفيه بالرجوع الصامت إلى Mock. هذا endpoint لا ينفذ أي تعديل.

## 3. مطابقة صفحات Admin ومصادر البيانات

- **الرئيسية:** `GET /api/admin/dashboard/summary` لمجاميع الطلب والرحلات والعرض والإيراد والانتظار؛ يفضّل أن يعيد وقت تكوين البيانات ونطاق الفترة ومصدره.
- **السائقون:** `GET /api/admin/drivers` مع بحث/ترقيم/حالة، ثم `GET /api/admin/drivers/{id}` للتفاصيل. تعديل الحساب يتطلب `PATCH` وصلاحية/سجل تدقيق منفصلين؛ API التدريب الحالي للقراءة فقط.
- **الركاب:** `GET /api/admin/passengers` والتفاصيل؛ لا تكشف الهاتف أو بيانات حساسة إلا لدور مسموح.
- **الطلبات:** `GET /api/admin/requests`; إنشاء/إلغاء الطلب عبر API يقرر الصلاحية والحالة. إسناد الطلب في التطبيق الفعلي endpoint خادمي واحد، لا سلسلة تعديلات مستقلة من المتصفح.
- **الرحلات:** `GET /api/admin/trips` والتفاصيل، ثم `PATCH /api/admin/trips/{id}/status` للحالات التي يسمح بها الخادم.
- **الخريطة:** `GET /api/admin/map/snapshot` يعيد عناصر الخريطة ذات الصلاحية مع الإحداثي ووقت القياس ودقة/حداثة الإشارة. اعرض الموقع فقط وفق موافقة السائق وسياسة التوفر/الرحلة، مع استبعاد النقاط القديمة من حساب العرض.
- **المسارات والمحطات:** `GET /api/admin/routes`, `POST/PATCH /api/admin/routes`, و`POST/DELETE /api/admin/routes/{id}/stations` حسب صلاحية الدور؛ يجب حفظ ترتيب المحطات وعدم كسر تكامل المسار.
- **التقارير:** `GET /api/admin/reports?from=...&to=...&groupBy=...`; يفصل الأجرة المحتسبة عن المبلغ المحصّل، والإيرادات عن المدفوعات والعمولات، ويذكر العملة والفترة ومصدر الأرقام.
- **ذكاء التشغيل:** endpoints في القسم التالي، ويجب أن تعيد معرف الموديل/النسخة وزمن التوليد/التحديث وحدود عدم اليقين ومصدر البيانات عند وجود تنبؤ أو تحليل.

## 4. نقاط API مقترحة لوحدات AI/NLP

شكل خطأ موحد مقترح لكل endpoint: `{ "error": { "code": "FORBIDDEN", "message": "لا تملك صلاحية الاطلاع على هذه البيانات.", "requestId": "req-123" } }`. يرجع HTTP status مناسبًا مثل `400` لمدخل غير صالح، `401/403` للمصادقة/الصلاحية، `404` لمورد غير موجود، `409` لتعارض الحالة، و`500` لخطأ الخادم؛ لا تعِد stack trace أو أسرارًا للمتصفح.

### أ. التنبؤ بالطلب والعرض (FR-9، FR-10، AIQ-03)

- طلب قراءة بلا body: `GET /api/admin/ai/forecasts?areaId=ALEX-SMO&from=2026-11-01T15:00:00%2B02:00&to=2026-11-01T17:00:00%2B02:00&granularity=hour`.
- لكل صف: `areaId`, `routeId`, `windowStart`, `windowEnd`, `expectedRequests`, `freeSeatsEstimate`, `gapSeats`, `lowerBound`, `upperBound`, `sourceSnapshotAt`, `modelVersion`, `generatedAt`, `confidence/uncertainty`, `evaluationStatus`.
- `gapSeats = expectedRequests - freeSeatsEstimate`: الموجب عجز، والسالب فائض. لا تحتسب مركبة غير متاحة أو إحداثي قديم كعرض حالي؛ اجمع المقاعد المتاحة لا عدد المركبات فقط.
- شكل استجابة `200 OK` توضيحي وليس أرقامًا فعلية:

```json
{
  "modelVersion": "demand-v0.1",
  "generatedAt": "2026-11-01T12:00:00Z",
  "sourceSnapshotAt": "2026-11-01T11:58:00Z",
  "evaluationStatus": "pending",
  "items": [{
    "areaId": "ALEX-SMO",
    "routeId": "RT-101",
    "windowStart": "2026-11-01T15:00:00+02:00",
    "windowEnd": "2026-11-01T16:00:00+02:00",
    "expectedRequests": 34,
    "freeSeatsEstimate": 20,
    "gapSeats": 14,
    "lowerBound": 28,
    "upperBound": 41,
    "uncertainty": { "level": "unvalidated", "label": "نطاق توضيحي غير مُعاير" }
  }]
}
```

### ب. إعادة التوزيع والحافز (FR-11، AIQ-04)

- `GET /api/admin/ai/recommendations?state=pending` لاستعراض التوصيات.
- `POST /api/admin/ai/recommendations/{id}/dispatch` لإرسال عرض **بعد** التحقق من السياسة والصلاحية والتأكيد البشري. يعيد الخادم الحالة ومعرف الإشعار؛ لا يفترض الواجهة قبول السائق.
- لكل توصية: المسار المتوافق، المسافة/الوقت، نافذة الحاجة، عدد المقاعد الحرة المتوقع بعد التحرك، فجوة ما قبل/بعد، مبلغ/قواعد الحافز وإصدار السياسة، سبب التوصية، حالة قبول/رفض السائق وتوقيتها.
- الإرسال اختياري للسائق؛ سجّل القبول والرفض، ولا تعرض إجراء «إعادة توزيع» كأنه تم لمجرد ظهور التوصية.

### ج. مراجعة NLP (FR-12.1–12.2، AIQ-02، UR-A05)

- `GET /api/admin/ai/feedback?state=pending&language=ar-EG,franco-arabic&page=1&pageSize=20` يعيد فقط التعليقات المسموح للمشرف رؤيتها. مثال استجابة `200 OK`:

```json
{
  "modelVersion": "nlp-eg-franco-v0.1",
  "generatedAt": "2026-11-01T12:02:00Z",
  "sourceSnapshotAt": "2026-11-01T11:58:00Z",
  "evaluationStatus": "pending",
  "items": [{
    "feedbackId": "FB-2401",
    "tripId": "TR-9018",
    "script": "franco_arabic",
    "text": "El entezar kan taweel w el mashwar tamam.",
    "createdAt": "2026-11-01T11:42:00+02:00",
    "sentiment": { "label": "neutral", "confidence": 0.63 },
    "category": { "label": "waiting_time", "confidence": 0.74 },
    "uncertainty": { "level": "high", "reason": "تهجئة Franco-Arabic تحتمل أكثر من معنى." },
    "review": { "state": "pending" }
  }]
}
```

- لمراجعة بشرية/تصحيح: `PATCH /api/admin/ai/feedback/FB-2401/review` مع جسم طلب مثل:

```json
{
  "decision": "corrected",
  "correctedSentiment": "negative",
  "correctedCategory": "waiting_time",
  "reviewerNote": "الانتظار هو الشكوى الأساسية في النص."
}
```

استجابة مقترحة `200 OK`: `{ "feedbackId": "FB-2401", "review": { "state": "corrected", "reviewerId": "ADM-17", "reviewedAt": "2026-11-01T12:10:00Z", "auditId": "AUD-908" } }`. تُسجل صلاحية المراجع والتوقيت والتصحيح في Backend؛ لا تثق في `reviewerId` يرسله المتصفح.

- كل تحليل يعيد `modelVersion`, `sentiment`, `category`, `confidence`, `uncertainty`, `createdAt`. دعم العربية المصرية وFranco-Arabic يحتاج بيانات اختبار معنونة لكل صيغة ولهجة.
- يجب تقييم المشاعر والفئات كلٌّ على حدة على بيانات held-out غير مستخدمة في التدريب؛ أظهر Precision/Recall/Macro-F1 عند توافر القياس فقط، ولا تساوِ نسبة الثقة بأداء النموذج.

### د. السلامة والمراجعة (FR-12.3–12.5، AIQ-05)

- `GET /api/admin/ai/safety/cases?state=review_required`
- `PATCH /api/admin/ai/safety/cases/{id}/review` يسجل القرار، الملاحظة، مراجعًا مخولًا، الوقت، والمرجع إلى إشارات المصدر.
- عوامل الدرجة قابلة للتفسير ومؤرخة ومحددة المصدر؛ بيانات الحركة لا تستخدم خارج سياق/موافقة الوردية أو الرحلة. وفّر للسائق شاشة يرى فيها الأدلة المرتبطة به وطلب التصحيح/الاعتراض.
- لا عقوبة آلية من الدرجة وحدها أو حدث واحد. اختبر التنبيهات الخاطئة، استقرار الدرجة عبر الوقت، والانحياز حيثما كانت البيانات والقوانين تسمح.

### هـ. مساعد النقل الإداري (FR-14، UR-G04، AIQ-06)

- `POST /api/admin/assistant/query` يرسل سؤال المشرف الموثق ودوره ونطاقه المعتمد إلى Backend؛ النموذج لا يُمنح اتصال PostgreSQL مباشرًا.
- مثال استجابة مقترح: `{ "answer": "...", "sources": [{"label":"...","updatedAt":"..."}], "toolsUsed": ["..."], "uncertainty": "...", "abstained": false, "actionProposal": null }`.
- الاسترجاع يقتصر على بيانات وخدمات NQLa المسموح بها، مع مصدر/حداثة/عدم يقين. ارفض/امتنع عند غياب الدليل أو تجاوز الدور. إجراءات دفع أو جزاء أو تغيير بيانات أو قرار سلامة تحتاج موافقة صريحة من مشرف مخول وتدقيقًا. دعم السائق/الراكب في تطبيقاتهم من مسؤولية تكاملهم المنفصل.

### و. التنبيهات والسياسات والتدقيق (FR-13، NFR-11–12، NFR-14)

- `GET /api/admin/alerts?priority=...`, `PATCH /api/admin/alerts/{id}/acknowledgement`.
- `GET /api/admin/policies?effectiveAt=...`, و`POST /api/admin/policies` ينشئ نسخة جديدة بتاريخ نفاذ، لا يغيّر نسخة قديمة بصمت.
- سجّل في `audit_logs`: الفاعل/الدور، العملية، الكيان ومعرّفه، الوقت، القيمة قبل/بعد أو سبب الرفض، ومعرّف الطلب. لا تحفظ أسرارًا أو نصوصًا حساسة غير لازمة.

## 5. قاعدة البيانات المشتركة

هذه جداول/علاقات مناقشة، لا migrations نهائية:

- الهوية والصلاحية: `users`, `roles`, `user_roles`; والملفات: `driver_profiles`, `passenger_profiles`, `vehicles`.
- النقل: `routes`, `stations`, `route_stations(route_id, station_id, sequence)`, `ride_requests`, `trips`, `trip_ratings`.
- التتبع: `driver_locations(driver_id, lat, lon, recorded_at, consent/context)` وفق سياسة الاحتفاظ والصلاحيات؛ لا تستخدم مواقع Demo كأنها هذه السجلات.
- الدفع والسياسة: `fare_rules` مع نسخ/تواريخ نفاذ، `payments`, `incentive_rules`, `incentive_offers`, `offer_responses`, `penalty_cases` مع مراجعة بشرية.
- الذكاء والتحقق: `forecast_runs`, `forecast_items`, `model_versions/evaluations`, `passenger_feedback`, `nlp_predictions`, `safety_signals`, `safety_assessments`, `human_reviews/appeals`, `alerts`, `audit_logs`.
- مفاتيح الربط الأساسية: الرحلة تربط الطلب والسائق والراكب والمسار؛ محطة المسار ترتب عبر `route_stations`; تقييم الراكب مرتبط برحلة مكتملة؛ المراجعة البشرية تشير إلى تحليل/بلاغ مصدر.

في عملية إسناد طلب، الخادم يتحقق من المعاملات والصلاحيات ويحدّث الطلب وينشئ الرحلة ويحجز السائق في معاملة واحدة. لا ترسل الواجهة أوامر منفصلة لتحديث عدة جداول؛ ذلك قد يترك بيانات غير متسقة.

## 6. أسماء الحالات والتعامل معها

اتفقوا على قيم ثابتة لكل مورد قبل الدمج. يفضّل API أن يعيد قيمًا معيارية مثل `available`, `offline`, `on_trip`, `suspended`؛ ويحوّلها `adminHttpApi.ts` إلى العرض العربي. حالات الطلب/الرحلة منفصلة؛ لا تستخدم كلمة «مكتمل» للسائق والطلب والرحلة بمعنى واحد. `src/data/types.ts` يوضح ترجمة العرض الحالية، ويمكن تحديث المحول بدل إعادة كتابة الصفحة. وثّقوا الانتقالات المسموحة ومن يستطيع تنفيذها.

## 7. إعداد اتصال التدريب الحالي

في هيكل مجلدك الحالي ضع `.env.local` **بجوار `package.json` داخل** `apps/admin_dashboard_web/admin_dashboard_web/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

ثم أوقف Vite بـ`Ctrl+C` وشغّل `pnpm dev` مجددًا من نفس مجلد `package.json`. الواجهة تقرأ `GET http://localhost:5000/api/admin/drivers`. اسمح في CORS بالأصل المحدد `http://localhost:3000`. لا تضع كلمة مرور PostgreSQL أو مفتاحًا خاصًا داخل React أو أي قيمة `VITE_`؛ قيم Vite عامة للمتصفح.

ملف `.env.local` غير مضمّن في حزمة التسليم ولا ينبغي رفعه إلى Git. إن استبدلت مجلد المشروع، انسخ الملف المحلي يدويًا بعد التحديث. الكود الحالي لا يرسل `Authorization` ولا يعدّل السائق؛ أضف المصادقة بعد اتفاق الفريق على Cookie/JWT وآلية refresh والصلاحيات.

## 8. تقييم النماذج قبل وصفها «ذكية/دقيقة»

- **Forecast:** فصل زمني للتدريب والاختبار لمنع تسرب المستقبل، baseline موسمي/متوسط تاريخي، MAE/RMSE على مستوى المنطقة/الفترة، ودراسة التعامل مع الأصفار/الذروة؛ سجّل نسخة البيانات والموديل.
- **NLP:** بيانات معنونة ومراجعة بشريًا بالعربية المصرية وFranco-Arabic؛ split مستقل، مصفوفة التباس وPrecision/Recall/Macro-F1 لكل فئة، ومراجعة خاصة لتقليل تفويت إشارات السلامة.
- **Safety:** صلاحية ومصدر ووقت لكل signal، استقرار زمني ومراجعات بشرية واستئناف، وعدم استعمال درجة غير معايرة للعقوبة.
- **Assistant:** اختبارات استرجاع واقعية، رفض مضبوط، صلاحيات حسب الدور، توثيق المصادر وحداثتها، ومراجعة بشرية للأفعال الحساسة.

لا تعرض الواجهة الحالية نتائج Accuracy/MAE/F1 فعلية لأنها غير متوفرة بعد؛ الرسوم/الأعداد التجريبية موسومة Demo.

## 9. سياسة مزوّد الخريطة

النسخة الحالية تستخدم MapLibre GL JS وخط النمط العام `https://tiles.openfreemap.org/styles/positron`، وتعرض إسناد OpenFreeMap/OpenMapTiles/OpenStreetMap في واجهة الخريطة. هذا ليس اتصالًا بخادم البلاطات القياسي `tile.openstreetmap.org`. خدمة البلاطات القياسية لها سياسة استخدام مستقلة: تتطلب إسنادًا واضحًا وتمنع الاستخدام الذي يسبب تنزيلًا كثيفًا أو نسخًا offline، وهي best-effort بلا SLA. [1]

دليل OpenFreeMap الرسمي يوضح عنوان النمط وطريقة التكامل؛ شروط الخدمة العامة لا تعني وجود SLA أو ضمان تشغيل إنتاجي. استخدموا مزودًا بعقد وقياس مناسبين أو استضيفوا البلاطات عند متطلبات حمل/استمرارية أعلى، واحتفظوا بإسناد المصادر ظاهرًا. [2][3] الإحداثيات الاصطناعية في اللوحة لا ترسل GPS حقيقيًا.

## 10. مراجع تقنية رسمية

[1] OpenStreetMap Foundation — Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/  
[2] OpenFreeMap — Quick Start: https://openfreemap.org/quick_start/  
[3] OpenFreeMap — Terms of Service: https://openfreemap.org/tos/  
[4] MapLibre GL JS — Documentation: https://maplibre.org/maplibre-gl-js/docs/  
[5] OpenStreetMap — Copyright and attribution: https://www.openstreetmap.org/copyright
