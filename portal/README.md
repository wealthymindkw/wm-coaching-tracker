# Wealthy Mind Client Portal — ملفات التصميم

ملفات mu-plugins الخاصة ببوابة العملاء (WordPress في Docker على سيرفر n8n).

- الموقع: https://portal.wealthymindkw.com
- الحاوية: `portal-wordpress-1` — المسار: `/var/www/html/wp-content/mu-plugins/`

## الملفات

| الملف | الوظيفة |
|---|---|
| `mu-plugins/wm-design.php` | نظام التصميم: هيدر أبيض بشعار، بانر عنوان كحلي بنمط سداسيات، قائمة برنامج جانبية (root=20)، صفحة دخول مقسومة متجاوبة |
| `mu-plugins/wm-zz-overrides.php` | تصحيحات نهائية تُحمّل أخيراً (توسيط المحتوى، إخفاء شريط الثيم الجانبي) |
| `mu-plugins/wm-login-button.php` | زر دخول/خروج ديناميكي في الهيدر |

ملفات mu-plugins أخرى موجودة على السيرفر وغير مُدارة هنا:
`wm-member-gate.php`, `wm-clean-layout.php`, `wm-whitelabel.php`, `wm-account.php`

## النشر

لا يوجد وصول SSH من بيئة Claude — النشر بلصق أمر واحد في ترمينال Hostinger
(الأمر يُولَّد من الملفات هنا: tar + base64 → `docker exec`). راجع جلسة العمل أو
اطلب من Claude توليد أمر النشر من آخر نسخة.

## نسخة احتياطية

`backup/pages-before-redesign-2026-07-08.json` — محتوى كل صفحات ووردبريس (raw)
قبل إعادة تصميم 8 يوليو 2026 (إزالة الإيموجي + ستايل القوائم الجديد).
