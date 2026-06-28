# Nodoost — PNG Assets (آیکن‌ها، لوگو و نشان‌ها)

تمام آیکن‌ها، لوگو و بَج‌ها به‌صورت **PNG شفاف (transparent)** و با کیفیتِ بالا. همه برداری بودند و در رزولوشنِ بزرگ رندر شده‌اند، پس بدونِ افتِ کیفیت قابلِ کوچک‌کردن‌اند.

## ساختار

```
assets-png/
├─ icons/            # ۲۸ آیکن، هرکدام در ۳ رنگ
│  ├─ gold/          # طلایی  #dab877  (مناسبِ پس‌زمینه‌ی تیره)
│  ├─ white/         # سفید   #ffffff  (روی عکس/تیره)
│  └─ ink/           # تیره   #241b15  (مناسبِ پس‌زمینه‌ی روشن)
├─ logo/
│  ├─ logo-mark-{gold,white,ink}.png   # نشانِ قلب+جرقه (۵۱۲px، شفاف)
│  ├─ app-icon-1024.png                # آیکنِ اپ، کاشیِ طلاییِ گرادیانی (۱۰۲۴px) — برای استور
│  ├─ app-icon-dark-1024.png           # آیکنِ اپ روی پس‌زمینه‌ی تیره
│  └─ wordmark-{on-dark,on-light}.png  # لوگوتایپ «نودوست + private circle»
└─ badges/
   ├─ tier-{silver,gold,platinum,diamond}.png   # بَج کاملِ سطح (پیل گرادیانی + نام)
   ├─ diamond-{silver,gold,platinum,diamond}.png # فقط لوزیِ سطح (۵۱۲px)
   └─ verified.png                               # نشانِ تأییدِ هویت (دایره‌ی طلایی + تیک)
```

## آیکن‌ها (۲۸ عدد)
ناوبری: `chevron-next`, `chevron-prev` · هدر: `filter`, `bell` · کنشِ کارت: `rewind`, `close` (رد), `star` (ستاره), `heart-fill` (پسند), `lightning-fill`/`lightning` (بوست/تصادفی) · تم: `sun`, `moon` · عمومی: `edit`, `check`, `phone`, `more`, `send-fill`, `lock`, `plus`, `shield`, `shield-check`, `clock`, `next-arrows`, `diamond-fill` · تب‌بار: `tab-discover`, `tab-likes`, `tab-chat`, `tab-profile`.

## رنگِ برند
- طلایی (برند): `#dab877` · طلاییِ روشن: `#f2dca8`
- رز (کنشِ احساسی): `#ff6f80`
- گرادیانِ اصلی: `linear-gradient(135deg, #f0d39a, #e09a72)`
- سطح‌ها: نقره‌ای `#c2c8d0→#8b94a0` · طلایی `#e7c074→#b8893f` · پلاتینیوم `#dbe3e9→#90a0ac` · الماس `#8fd6ff→#2f8fd0`

> نکته: آیکن‌ها روی شبکه‌ی ۲۴×۲۴ با حاشیه‌ی امن طراحی شده‌اند؛ برای استفاده در اپ، هم می‌تونی همین PNGها رو بذاری و هم (بهتر) از نسخه‌ی برداریِ موجود در `نودوست.dc.html` کامپوننتِ آیکن بسازی.
