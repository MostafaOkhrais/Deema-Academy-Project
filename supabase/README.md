# إعداد نظام الحسابات (Supabase)

الموقع ثابت (Astro) والحسابات تعمل من المتصفح مباشرة مع Supabase. **الأمان كله في سياسات قاعدة البيانات (RLS)** الموجودة في `migrations/0001_accounts.sql`؛ المفتاح العام (anon) آمن للنشر، وصفحة `/admin` تحمي الواجهة فقط بينما الصلاحية الحقيقية تأتي من القاعدة.

## الخطوات (مرة واحدة)

1. أنشئ مشروعاً على https://supabase.com (الخطة المجانية تكفي للبداية). في خيارات **Security** عند الإنشاء:
   - **Enable Data API**: مفعّل (ضروري).
   - **Automatically expose new tables**: أزل التحديد (موصى به؛ الملف يمنح الصلاحيات الضرورية صراحةً).
   - **Enable automatic RLS**: فعّله (شبكة أمان إضافية).
   - احفظ كلمة مرور قاعدة البيانات في مكان آمن.
2. من **SQL Editor** نفّذ بالترتيب `supabase/migrations/0001_accounts.sql` ثم `0002_harden_function_exposure.sql`. (مشروعك الحالي طُبّق عليه الملفان بالفعل.)
3. من **Project Settings → API** انسخ `Project URL` و`anon public key` إلى ملف `.env` (انسخ `.env.example`):
   ```
   PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   وأضفهما نفسهما في **Environment Variables** على Vercel، ثم أعد النشر.
4. من **Authentication → URL Configuration**:
   - Site URL: عنوان موقعك (مثلاً `https://deema.academy`).
   - Redirect URLs: أضف `https://deema.academy/account` و`https://deema.academy/reset` (وللتجربة المحلية `http://localhost:4321/account` و`http://localhost:4321/reset`).
5. من **Authentication → Providers → Email**:
   - اترك **Confirm email** مفعّلاً (موصى به). التسجيلات التي اختارها المشترك قبل التفعيل تُضاف لحسابه تلقائياً عند أول دخول.
   - ارفع الحد الأدنى لطول كلمة المرور إلى 8 أو أكثر.
6. (اختياري) **Authentication → Email Templates**: عرّب رسائل التفعيل والاستعادة.

## أول مدير

سجّل حساباً عادياً من `/signup`، ثم نفّذ في SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'بريدك@example.com';
```

بعدها يظهر زر «لوحة الإدارة» في صفحة حسابك. الأدمن لا يُنشأ من الواجهة أبداً.

## ماذا يستطيع كل طرف

| | المشترك | المدير |
|---|---|---|
| الملف الشخصي | يقرأ ويعدّل ملفه (الاسم، الجوال، المدينة، الوضع، التخصص، المرحلة) | يقرأ كل الملفات |
| الدور والبريد | لا يستطيع تغييرهما | لا يتغيران إلا من SQL |
| التسجيلات | ينشئ طلباً بحالة «قيد المراجعة»، ويلغي طلباته قيد المراجعة فقط | يرى الكل ويغيّر الحالة |
| الشهادات | يقرأ شهاداته | يصدر ويحذف |

## التحقق من شهادة

دالة `verify_certificate(code)` متاحة للعامة وتعيد اسم الحامل وعنوان الشهادة فقط. لم تُبنَ لها صفحة بعد.

## ملاحظات

- لا تضع `service_role key` في الواجهة أو في متغيرات `PUBLIC_*` أبداً.
- بدون ضبط المتغيرين تعرض صفحات الحساب رسالة «قيد الإعداد» ولا تنكسر بقية الصفحات.
