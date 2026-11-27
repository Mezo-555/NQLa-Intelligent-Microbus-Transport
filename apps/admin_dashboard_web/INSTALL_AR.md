# تركيب لوحة NQLa Admin في مشروعك

هذه الحزمة تحتوي ملفات مشروع Vite مباشرة في جذر ZIP (مثل `package.json` و`src/`)، ولا يوجد بداخلها مجلد `admin_dashboard_web` إضافي.

## قبل الاستبدال

في مجلد مشروعك الحالي، خذ نسخة احتياطية للمجلد الداخلي الذي يحتوي `package.json`. هيكلك الذي ظهر في الطرفية كان بهذا الشكل:

```text
C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web\package.json
```

أي أن المجلد الثاني `admin_dashboard_web` هو جذر React/Vite. لا تحذف ملف `.env.local` إن كنت تستخدم API التدريب؛ الحزمة لا تحتوي هذا الملف ولا كلمة مرور قاعدة البيانات.

## استخراج الملفات

1. نزّل ملف `NQLa_Admin_Dashboard_AI_Ready.zip`.
2. افتح ZIP وتأكد أن أول مستوى يعرض `package.json` و`src` و`public` وملفات `.md` مباشرة.
3. استخرج **محتويات** ZIP إلى هذا المجلد:

```text
C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web
```

4. وافق على استبدال ملفات المشروع القديمة. إذا ظهرت نافذة تختار فيها مجلد الوجهة، اختر المجلد الداخلي أعلاه نفسه؛ لا تختَر `apps` ولا `apps\admin_dashboard_web` لتجنب مجلد ثالث متداخل.
5. بعد انتهاء الاستخراج، تأكد أن هذا المسار موجود:

```text
C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web\package.json
```

إن لم تجد `package.json` مباشرة داخل المجلد الذي فتحته، فقد تم الاستخراج في مستوى غير صحيح.

## التشغيل في VS Code / PowerShell

افتح Terminal في VS Code وشغّل:

```powershell
cd C:\dev\NQLa-Intelligent-Microbus-Transport\apps\admin_dashboard_web\admin_dashboard_web
pnpm install
pnpm dev
```

افتح رابط Vite الظاهر في الطرفية (غالبًا `http://localhost:3000`). اترك نافذة الطرفية مفتوحة أثناء الاستخدام؛ للإيقاف ارجع إليها واضغط `Ctrl+C`.

لاختبار بناء المشروع بعد التثبيت:

```powershell
pnpm build
```

## استمرار ربط API التدريب

إذا كنت قد أنشأت `.env.local` في نفس المجلد بجوار `package.json`، احتفظ به بعد استبدال الملفات. محتواه التدريبي الذي سبق إعداده:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

لتظهر بيانات السائقين من PostgreSQL التدريبي، شغّل Backend التدريب في Terminal ثانية على `http://localhost:5000`. صفحة السائقين تقرأ فقط؛ بقية البيانات وAI والخريطة تظل Mock إلى أن يجهز Backend/ML الفعلي. لا تضع كلمة مرور PostgreSQL في `.env.local` الخاص بالواجهة أو في أي متغير يبدأ بـ`VITE_`.
