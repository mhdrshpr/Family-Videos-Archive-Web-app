# 🎬 سامانه آرشیو ویدئوهای خانوادگی «خانواده من»
> **پایگاه اختصاصی، آفلاین و قابل‌حمل (Portable) برای تماشا، دسته‌بندی و آرشیو خاطرات ویدئویی خانوادگی بر روی هارد اکسترنال / حافظه SSD.**

<div align="center">

[![Version](https://img.shields.io/badge/Version-v2.6.0-black?style=flat-square&logo=git&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-black?style=flat-square&logo=linux&logoColor=white)](#)
[![Offline](https://img.shields.io/badge/Offline-100%25%20Portable-success?style=flat-square&logo=speedtest&logoColor=white)](#)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Vanilla)-orange?style=flat-square&logo=javascript&logoColor=white)](#)
[![Design](https://img.shields.io/badge/Design-Luxury%20Monochrome-black?style=flat-square&logo=sketch&logoColor=white)](#)
[![Language](https://img.shields.io/badge/Language-Persian%20%7C%20فارسی-red?style=flat-square&logo=googletranslate&logoColor=white)](#)

</div>

---

## 📖 درباره پروژه (About The Project)

این سامانه به گونه‌ای مهندسی شده است که مستقیماً روی یک **هارد اکسترنال (External HDD)** یا **حافظه پرسرعت SSD** مستقر می‌شود. 
کاربر پس از اتصال هارد/فلش به هر رایانه‌ای (بدون نیاز به نصب هیچ‌گونه نرم‌افزار، افزونه یا پایگاه داده جانبی و بدون نیاز به اینترنت)، تنها با دو بار کلیک بر روی فایل **`index.html`** وارد محیطی سینمایی با طراحی مینیمال مونوکروم (مشکی و سفید) می‌شود و به آرشیو ویدئوها با دسته‌بندی سالانه، تگ‌گذاری پیشرفته، جستجوی بلادرنگ و پلیر اختصاصی دسترسی پیدا می‌کند.

---

## ✨ ویژگی‌های کلیدی سامانه (Key Features)

- 🚀 **اجرای ۱۰۰٪ آفلاین و پرتابل (Zero Setup / Plug & Play):** اجرا از طریق پروتکل `file:///` مستقیماً از روی درایو هارد یا فلش با پشتیبانی از مرورگر Google Chrome.
- 🎬 **پلیر سینمایی پیشرفته (Custom Cinema Player):** 
  - اسکرابر زمان روان ۶۰ فریم و خط زمان تعاملی
  - پیش‌نمایش هوشمند فریم‌ها هنگام هاور موس (Hover Video Preview)
  - کنترل‌های دابل‌کلیک جلو/عقب ۱۰ ثانیه با گرادیانت نوری
  - پشتیبانی از تمام‌صفحه و کلیدهای میانبر استاندارد کیبورد
  - امکان انتخاب پخش در اپلیکیشن‌های VLC ،KMPlayer، پخش‌کننده پیش‌فرض ویندوز یا پلیر اختصاصی مرورگر
- 🔍 **سیستم دسته‌بندی، فیلتر و جستجوی بلادرنگ:**
  - جستجوی آنی در عنوان، سال، توضیحات، تگ‌ها و نام ثبت‌کننده خاطره
  - فیلتر بر اساس سال ضبط و وضعیت ویدئوهای نیازمند تکمیل اطلاعات
- 🏷️ **تگ‌گذاری نامحدود با پیشنهاد خودکار:** ثبت خاطرات، نام اشخاص حاضر در فیلم و موضوعات با چیپ‌های تعاملی.
- 💾 **پایداری داده‌ها و همگام‌سازی دوطرفه:** 
  - پایگاه داده ساختاریافته در فایل `data.json`
  - قابلیت «همگام‌سازی و ذخیره» با اسکن خودکار فایل‌های پوشه `VIDEOS`
  - سیستم هوشمند تشخیص فایل‌های حذف‌شده و امکان حفظ اطلاعات یا حذف قطعی کارت
- 📱 **طراحی واکنش‌گرا و بارکد اختصاصی آفلاین (Offline QR Code):** 
  - نوار ابزار شیشه‌ای شناور در موبایل با افکت مات لوکس (`Backdrop Blur`)
  - تولید مستقیم بارکد QR برای هر فیلم جهت اسکن سریع و اشتراک‌گذاری
- 🔐 **حریم خصوصی و امنیت:** امکان تنظیم نام ویرایشگر و رمز عبور (Master PIN) جهت جلوگیری از تغییرات ناخواسته در مشخصات ثبت‌شده.
- 🛠️ **حالت تعمیر نرم‌افزار (Maintenance & Diagnostics):** سیستم لاگ کامپکت و اختصاصی با امکان فعال/غیرفعال‌سازی از منوی تنظیمات.

---

## 🛠️ فناوری‌های مورد استفاده (Tech Stack)

<div align="center">

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B%20Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![Google Chrome](https://img.shields.io/badge/Browser-Google%20Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![Storage](https://img.shields.io/badge/Storage-JSON%20%2B%20LocalStorage-333333?style=flat-square&logo=json&logoColor=white)](#)
[![Typography](https://img.shields.io/badge/Typography-Yekan%20Bakh-555555?style=flat-square)](#)

</div>

---

## 📂 ساختار پوشه‌بندی در هارد دیسک / SSD

برای عملکرد بهینه، فایل‌های ویدئویی خانوادگی در پوشه `VIDEOS` در کنار فایل اصلی قرار می‌گیرند:

```text
[External HDD / SSD Root]/
│
├── index.html            # 👈 نقطه ورود اصلی؛ فقط کافیست روی این فایل کلیک کنید
├── README.md             # مستندات، راهنما و برچسب‌های پروژه
├── LICENSE               # مجوز رسمی متن‌باز (MIT License)
├── .gitignore            # نادیده گرفتن فایل‌های حجیم شخصی در مخزن گیت
│
├── VIDEOS/               # 📁 محل قرارگیری ویدئوها و فیلم‌های خانوادگی (MP4, MKV, WebM, ...)
│   └── .gitkeep
│
└── code/                 # ⚙️ هسته فنی و کدهای اجرایی سامانه
    ├── index.html        # نسخه توسعه سامانه
    ├── player.html       # پلیر سینمایی اختصاصی در برگه جدید
    ├── favicon.svg       # آیکون وکتور اختصاصی برند
    ├── data.json         # پایگاه داده مشخصات و آرشیو ویدئوها (خام و آماده بارگذاری)
    ├── BACKUP.JSON       # فایل قالب خروجی پشتیبان
    ├── server.py         # سرور محلی پایتون (اختیاری جهت پخش لوکال در شبکه خانگی)
    ├── sync_root.py      # اسکریپت خودکار همگام‌سازی فایل ریشه
    ├── css/              # استایل‌های تم سینمایی مونوکروم و ریسپانسیو
    ├── js/               # ماژول‌های جاوااسکریپت (app, player, logger, icons, qrcode)
    ├── fonts/            # قلم یکان‌بخش (Yekan Bakh)
    ├── thumbnails/       # تصاویر بندانگشتی استخراج‌شده
    └── logs/             # لاگ‌های تشخیصی حالت تعمیر نرم‌افزار
```

---

## 🚀 راهنمای سریع استفاده (Quick Start)

1. ویدئوها و کلیپ‌های خانوادگی خود را درون پوشه **`VIDEOS`** کپی کنید.
2. روی فایل **`index.html`** در ریشه درایو دابل‌کلیک کنید تا در مرورگر (ترجیحاً کروم) باز شود.
3. در بار اول، دکمه **«ثبت پوشه مرجع»** (با فلش راهنما) را بزنید و پوشه `VIDEOS` را تایید نمایید.
4. روی دکمه **«همگام‌سازی و ذخیره»** کلیک کنید تا کلیه ویدئوها شناسایی و به سامانه اضافه شوند.
5. مشخصات هر فیلم (عنوان، سال، تگ‌ها و توضیحات) را با زدن دکمه ویرایش تکمیل نمایید.

---

## 🏷️ برچسب‌ها و موضوعات مخزن (GitHub Topics)

<div align="center">

[![Family Archive](https://img.shields.io/badge/topic-family--archive-111111?style=flat-square)](#)
[![Cinema Player](https://img.shields.io/badge/topic-cinema--player-111111?style=flat-square)](#)
[![Portable App](https://img.shields.io/badge/topic-portable--app-111111?style=flat-square)](#)
[![External HDD](https://img.shields.io/badge/topic-external--hdd-111111?style=flat-square)](#)
[![SSD Archive](https://img.shields.io/badge/topic-ssd--archive-111111?style=flat-square)](#)
[![Offline Player](https://img.shields.io/badge/topic-offline--video--player-111111?style=flat-square)](#)
[![Vanilla JS](https://img.shields.io/badge/topic-vanilla--javascript-111111?style=flat-square)](#)
[![Persian UI](https://img.shields.io/badge/topic-persian--ui-111111?style=flat-square)](#)
[![Zero Dependencies](https://img.shields.io/badge/topic-zero--dependencies-111111?style=flat-square)](#)
[![Dark Mode](https://img.shields.io/badge/topic-dark--mode-111111?style=flat-square)](#)

</div>

---

## 📄 مجوز انتشار (License)

این پروژه تحت مجوز **[MIT License](LICENSE)** منتشر شده است. استفاده، تکثیر، شخصی‌سازی و توسعه‌ی آن به صورت کاملاً رایگان و آزاد مجاز است.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)

**توسعه‌یافته با همکاری `MAHDYAR SHAHPARI x Gemini - 2026`**

</div>
