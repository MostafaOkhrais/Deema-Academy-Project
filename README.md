# موقع أكاديمية ديما

Astro (إخراج ثابت) · TypeScript · CSS مرتبط بالمكوّنات فوق tokens مشتركة · عربي RTL.

## التشغيل

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # الناتج في dist/ (يُنشر كما هو على Vercel)
npm run check      # فحص الأنواع
```

## هيكل المشروع

```
src/
  components/   كل قسم مكوّن مستقل (Hero, Story, Tracks, Join, Faq ...) مع أنماطه وسكربته
  data/         المحتوى: tracks.ts (المسارات) و content.ts (رحلة د. ديما، الأسئلة، الخطوات)
  lib/          supabase.ts / accounts.ts / admin.ts (الحسابات) · icons.ts · dom.ts · forms.ts
  scripts/      منطق صفحات الحساب (signup, login, reset, account, admin, landing)
  pages/        index + signup, login, reset, account, admin
  styles/       fonts.css · tokens.css (الألوان والمقاييس) · base.css (المفردات المشتركة)
  assets/       صور د. ديما والشعار (تُحسَّن تلقائياً وقت البناء)
public/fonts/   خط ثمانية (Serif Display و Sans)
supabase/       مخطط قاعدة البيانات والصلاحيات + دليل الإعداد
```

## ما الذي تعدّله

| الهدف | المكان |
|---|---|
| نصوص المسارات | `src/data/tracks.ts` |
| محطات د. ديما، الأسئلة الشائعة، الخطوات | `src/data/content.ts` |
| نص الورشة | `src/components/Workshop.astro` (ومعرّفها `WORKSHOP_REF` في `src/lib/accounts.ts`) |
| الألوان والمقاييس | `src/styles/tokens.css` |
| نظام الحسابات | `supabase/README.md` (الإعداد خطوة بخطوة) و`.env` (انسخ `.env.example`) |

## الحسابات

تسجيل وتسجيل دخول واستعادة كلمة المرور بالبريد، وصفحة `/account` (الملف الشخصي، مساراتي وتسجيلاتي، الشهاداتي)، وصفحة `/admin` للإدارة (الطلبات والمشتركون وإصدار الشهادات). الخلفية Supabase؛ كل الصلاحيات في `supabase/migrations/0001_accounts.sql`.

## الخط

ملفات خط ثمانية (Serif Display و Sans، خمسة أوزان لكل منهما) موجودة في `public/fonts/` وتُنشر مع الموقع. الخط ملك لثمانية ويُستخدم هنا وفق شروطها، ولا يُعاد استخدام الملفات في مشاريع أخرى.

## الأمان

- ترويسات الأمان وCSP صارمة في `vercel.json` (بدون سكربتات أو أنماط مضمّنة). إن غيّرت مشروع Supabase حدّث عنوانه في `connect-src`.
- كل الصلاحيات في قاعدة البيانات (RLS) داخل `supabase/migrations`؛ المفتاح العام وحده في الواجهة.
- لا تضع `service_role` ولا ملف `.env` في git.

## ملاحظات

- موعد الورشة "قريباً" كما في منشورك؛ عند تحديده غيّر السطر في `Workshop.astro`.
- شهادات المسارات وتفاصيل القبول في الأسئلة الشائعة نصوص مبدئية تحتاج تأكيدك.
