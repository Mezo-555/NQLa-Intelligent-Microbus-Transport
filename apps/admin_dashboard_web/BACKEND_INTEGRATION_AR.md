# ربط NQLa Admin بالـAPI وقاعدة البيانات — خطوة خطوة

هذا الدليل يشرح الربط للمبتدئ: **React لا يتصل بقاعدة البيانات مباشرةً**. المتصفح يرسل HTTP إلى Backend API؛ والـBackend وحده يتحقق من الصلاحيات وينفذ قواعد النظام ويتعامل مع PostgreSQL.

```text
Admin React ── طلب HTTP/JSON ── Backend API ── SQL آمن ── PostgreSQL
```

الـAPI هو عقد بين الطرفين: عنوان العملية، المدخلات، شكل JSON الراجع، حالات الخطأ، ومن يملك الصلاحية. الـBackend يمكن أن يكون بأي لغة يتفق عليها الفريق؛ React لا يفرض Node.

## 1. ما الموجود الآن في مشروعك؟

- `src/data/types.ts`: أنواع العرض مثل `Driver`, `RideRequest`, `Trip` والحالات التي تفهمها الشاشات.
- `src/data/mockAdminApi.ts` و`src/data/mockAiAdminApi.ts`: عينة محلية وتدفقات تجريبية لبقية الصفحات؛ التعديلات تُحفظ في ذاكرة الصفحة وتعود للعينة بعد إعادة التحميل.
- `src/data/adminHttpApi.ts`: عميل HTTP حقيقي **للقراءة فقط لقائمة السائقين**. عند ضبط `VITE_API_BASE_URL` يطلب `GET {العنوان}/admin/drivers`، ويقبل مصفوفة مباشرة أو `{ "data": [...] }`. بدونه يرجع لبيانات السائقين Mock. إذا فشل API بعد ضبط العنوان تظهر رسالة خطأ، ولا يخفيها البرنامج برجوع صامت إلى Mock.
- صفحة السائقين تستخدم `fetchApiDrivers()` بالفعل، وتعطّل إجراء تغيير الحساب في وضع API لأن API التدريبي الحالي لا يقدم تعديلًا.
- خريطة OpenFreeMap تعرض نقاطًا جغرافية Mock فقط؛ بقية AI/ML/NLP والمساعد لم تتصل بخدمات حقيقية.

## 2. كيف ترتبط قاعدة البيانات بالصفحة؟

مثال: عند فتح قائمة السائقين، يحصل التسلسل التالي:

1. صفحة React تستدعي `fetchApiDrivers()`.
2. دالة HTTP تبعث `GET http://localhost:5000/api/admin/drivers`.
3. Backend يستقبل الطلب ويتحقق من المستخدم والصلاحية.
4. Backend ينفذ SQL على PostgreSQL.
5. Backend يحول الصفوف إلى JSON ويرجعها.
6. `adminHttpApi.ts` يحول شكل JSON إلى نوع `Driver` الذي تعرضه الصفحة.

لو تغيرت بنية JSON، تعدّل دالة التحويل في `adminHttpApi.ts` بدل ما تجعل مكوّنات الواجهة تعتمد على شكل قاعدة البيانات مباشرةً. لا تضع اتصال PostgreSQL أو كلمة المرور في React.

## 3. تشغيل API التدريب الحالي

أنت أنشأت Backend تدريبيًا على `http://localhost:5000` مع endpoint:

```text
GET http://localhost:5000/api/admin/drivers
```

استجابة ممكنة:

```json
[
  { "id": 1, "name": "أحمد محمد", "phone": "0101...", "vehicle": "ميكروباص تويوتا", "state": "متاح", "rating": 4.9 }
]
```

ويُقبل أيضًا:

```json
{ "data": [{ "id": 1, "name": "أحمد محمد", "phone": "0101...", "vehicle": "ميكروباص تويوتا", "state": "available", "rating": "4.9" }] }
```

واجهة React تحوّل `available` أو `متاح` إلى نفس حالة العرض. القيم الأخرى التي يحولها الكود حاليًا: `on_trip`/`in_trip`، `offline`، و`suspended`. في نظام الفريق النهائي اتفقوا على مفاتيح ثابتة، والأفضل أن تكون قيم API معيارية بالإنجليزية، ثم تعرضها الواجهة بالعربية.

## 4. إعداد عنوان API في React

ضع `.env.local` بجوار `package.json` داخل مجلد المشروع. في تنظيم مجلداتك الحالي هذا هو:

```text
C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web\.env.local
```

محتواه:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

أوقف `pnpm dev` بـ`Ctrl+C` ثم شغله من المجلد الذي فيه `package.json`؛ Vite يقرأ env عند بدء التشغيل. إذا كان ملفك مضبوطًا بالفعل لا تكرر إنشاءه ولا تحذف قيمته.

## 5. شغّل الطرفين بالتوازي

افتح طرفيتين في VS Code.

**طرفية Backend** — من مجلد API التدريبي:

```powershell
cd C:\dev\nqla-learning-api
pnpm exec node .\server.js
```

**طرفية لوحة Admin** — من مجلد `package.json` الداخلي:

```powershell
cd C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web
pnpm dev
```

اترك الطرفيتين تعملان. افتح عنوان Vite الذي يظهر، غالبًا `http://localhost:3000`، ثم صفحة «السائقون». إذا لم يظهر الاسم من قاعدة البيانات، جرّب endpoint أولًا من PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/api/admin/drivers
```

ثم راجع أدوات المتصفح `F12 → Network`، افتح طلب `admin/drivers` وانظر إلى `Status` و`Response`.

في `server.js` يجب أن يسمح CORS بأصل لوحة التطوير المحدد `http://localhost:3000`. إذا ظهر خطأ CORS، فالخلل في إعداد السماح داخل Backend، لا في PostgreSQL ولا في ملف React. مع Cookies يجب السماح بالأصل المحدد والاعتمادات معًا، لا `*`.

## 6. ماذا تتفق مع فريق Backend عليه؟

قبل توصيل أي صفحة، اطلب لكل عملية: `METHOD`, المسار، صلاحية الدور، JSON للطلب، JSON للاستجابة، أسماء الحالات، وJSON للخطأ. أمثلة للمناقشة وليست مسارات نهائية:

- الرئيسية: `GET /api/admin/dashboard/summary`.
- السائقون: `GET /api/admin/drivers?search=...&state=...`; تعديل الحساب لاحقًا: `PATCH /api/admin/drivers/{id}/account`.
- الركاب: `GET /api/admin/passengers`.
- الطلبات: `GET /api/admin/requests`; إسناد خادمي متماسك: `POST /api/admin/requests/{id}/assign` مع `driverId`.
- الرحلات: `GET /api/admin/trips`; تحديث مسموح: `PATCH /api/admin/trips/{id}/status`.
- الخريطة: `GET /api/admin/map/snapshot` ويشمل وقت تحديث الموقع ومؤشر حداثته؛ النقاط التجريبية الحالية ليست GPS.
- المسارات: `GET /api/admin/routes` مع المحطات مرتبة.
- التقارير: `GET /api/admin/reports?from=...&to=...` مع توضيح العملة والمصدر.
- AI/NLP: عقد مفصل مقترح موجود في `AI_ADMIN_API_CONTRACT_AR.md`؛ الموديلات والمساعد والتصنيفات غير موصولة الآن.

الإسناد مثال مهم: عند ضغط المشرف «إسناد»، يجب أن يتحقق Backend أن الطلب مفتوح والسائق متاح ومصرّح له، ثم يحدّث الطلب ويحجز السائق وينشئ الرحلة داخل معاملة واحدة. لا تجعل React يغير ثلاثة جداول/خدمات منفصلة بنفسه.

## 7. خطوات إضافة endpoint جديد بعد اتفاق الفريق

ابدأ بصفحة واحدة فقط:

1. جرّب endpoint في المتصفح أو Postman أو `Invoke-RestMethod` وتأكد من HTTP 200 وJSON المتوقع.
2. راجع `src/data/types.ts`؛ حدّث النوع إذا كانت استجابة الفريق تحمل حقولًا مختلفة.
3. أضف دالة داخل `src/data/adminHttpApi.ts` تستدعي endpoint وتحول JSON إلى نوع الواجهة. استخدم `fetchApiDrivers()` كمرجع لقراءة ومعالجة الخطأ.
4. غيّر loader في الصفحة المستهدفة فقط، واترك الصفحات التي لم تكتمل APIs لها على Mock.
5. لا تضف PATCH/POST قبل معرفة الصلاحيات والحالات والتحقق الذي ينفذه Backend.
6. شغّل `pnpm build` وافحص صفحة الواجهة وNetwork. إذا فشل API بعد ضبط العنوان، أصلح المسار/JSON/CORS ولا تضف fallback يخفي المشكلة.

## 8. قواعد لا تتخطاها

- لا تضع كلمة مرور PostgreSQL أو `DATABASE_URL` أو مفاتيح API في React أو متغير يبدأ بـ`VITE_`؛ كل قيمة Vite تظهر لمستخدم المتصفح.
- لا تكتب من React إلى قاعدة البيانات مباشرة. الـBackend هو المكان الذي يفرض الصلاحيات والتحقق والمعاملات.
- `.env.local` محلي ومستثنى من Git؛ لا ترفعه ولا ترسله داخل ZIP. عند استبدال مجلد الواجهة احتفظ به أو أنشئه مجددًا بجوار `package.json`.
- لا تخلط «أجرة الرحلة» مع «دفعة تم تحصيلها». يلزم سجل دفع منفصل.
- لا تعرض Mock أو درجات Demo على أنها أرقام تشغيل أو دقة موديل حقيقية.
- بيانات GPS تُعرض وفق موافقة السائق، وصلاحية المشرف، ووقت تحديث واضح، وسياسة احتفاظ.

## الخلاصة

```text
React Admin → طلب HTTP/JSON → Backend (التحقق والمنطق والصلاحيات) → PostgreSQL
```

أنت نجحت في خطوة تعليمية مفيدة: لوحة React تقرأ قائمة السائقين من API، والـAPI يقرأ من PostgreSQL. الخطوة التالية مع فريق المشروع هي توحيد العقد والحالات والصلاحيات، ثم ربط كل صفحة تدريجيًا دون جعل Admin يتصل بقاعدة البيانات مباشرةً.
