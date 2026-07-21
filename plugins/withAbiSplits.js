// Config plugin برای تقسیمِ APK بر اساسِ معماری (ABI splits) — کاهشِ حجمِ دانلود.
//
// چرا: APKِ «universal» کتابخانه‌های نیتیوِ *هر دو* معماری را با خود حمل می‌کند
// (arm64-v8a ≈ ۲۰MB + armeabi-v7a ≈ ۱۴MB)، در حالی که هر دستگاه فقط یکی را
// اجرا می‌کند. با split، هر کاربر فقط سهمِ خودش را دانلود می‌کند.
//
// چرا بی‌خطر است: هیچ کدی حذف یا مبهم‌سازی (obfuscate) نمی‌شود — همان بایت‌کد،
// همان کتابخانه‌ها، فقط بسته‌بندیِ جدا. برخلافِ R8/ProGuard ریسکی برای
// Poolakey یا Fetchy SDK (که از reflection استفاده می‌کنند) ندارد.
//
// بازار رسماً «بارگذاری چند بسته در یک رهانش» را پشتیبانی می‌کند و بستهٔ سازگار
// را خودش به هر دستگاه می‌دهد:
//   https://developers.cafebazaar.ir/fa/guidelines/feature/device-specification
//
// قانونِ بازار: هر بسته باید versionCodeِ یکتا داشته باشد و versionCodeِ هر
// معماری باید از رهانشِ قبلیِ همان معماری بزرگ‌تر باشد. پس versionCode را به
// صورتِ  base*10 + ابیindex  می‌سازیم:
//   app.json versionCode = 13  →  armeabi-v7a = 131 ، arm64-v8a = 132
//   رهانشِ بعدی (14)        →  armeabi-v7a = 141 ، arm64-v8a = 142   (صعودی ✔)
//
// arm64 عمداً کدِ بزرگ‌تر می‌گیرد تا دستگاه‌هایی که هر دو را پشتیبانی می‌کنند
// نسخه‌ی ۶۴بیتی (سریع‌تر) را بگیرند.
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'NODOOST_ABI_SPLITS';

// ترتیب مهم است: اندیسِ بزرگ‌تر = اولویتِ بالاتر برای دستگاه‌های چندمعماری.
const ABI_INDEX = { 'armeabi-v7a': 1, 'arm64-v8a': 2 };

const SPLITS_BLOCK = `
    // ${MARKER} — تزریق‌شده توسطِ plugins/withAbiSplits.js
    splits {
        abi {
            enable true
            reset()
            include ${Object.keys(ABI_INDEX).map((a) => `'${a}'`).join(', ')}
            universalApk false
        }
    }
`;

const VERSION_CODE_BLOCK = `
// ${MARKER} — versionCodeِ یکتا برای هر معماری (شرطِ بازار برای چند بسته).
android.applicationVariants.all { variant ->
    variant.outputs.each { output ->
        def abi = output.getFilter(com.android.build.OutputFile.ABI)
        if (abi != null) {
            def abiIndex = [${Object.entries(ABI_INDEX)
              .map(([abi, i]) => `'${abi}': ${i}`)
              .join(', ')}]
            output.versionCodeOverride = variant.versionCode * 10 + abiIndex.get(abi)
        }
    }
}
`;

module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let src = cfg.modResults.contents;

    if (src.includes(MARKER)) return cfg; // idempotent

    // ۱) بلاکِ splits را داخلِ android { … } بگذار (بعد از اولین «android {»).
    src = src.replace(/^android\s*\{\n/m, (m) => m + SPLITS_BLOCK);

    // ۲) override کردنِ versionCode در انتهای فایل (بعد از تعریفِ android).
    src += VERSION_CODE_BLOCK;

    cfg.modResults.contents = src;
    return cfg;
  });
};
