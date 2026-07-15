// Config plugin برای یکپارچه‌سازیِ Fetchy SDK (اعلانِ pull-based) در بیلدِ نیتیوِ اندروید.
//
// چون پوشه‌ی android/ توسطِ `expo prebuild` بازتولید (و git-ignore) می‌شود، همه‌ی
// تغییراتِ نیتیو باید در زمانِ prebuild تزریق شوند. این پلاگین چهار کار می‌کند:
//   ۱) وابستگیِ Gradle به SDK را از JitPack اضافه می‌کند (app/build.gradle).
//   ۲) اطمینان از حضورِ ریپازیتوریِ JitPack در build.gradleِ ریشه (idempotent).
//   ۳) فایلِ کانفیگ را در android/app/src/main/assets/fetchy-config.json می‌نویسد.
//   ۴) در MainApplication.onCreate یک بار Fetchy.initialize(this) را صدا می‌زند.
//
// مجوزها (INTERNET / ACCESS_NETWORK_STATE / POST_NOTIFICATIONS) و اکتیویتیِ پروکسیِ
// اعلان، توسطِ خودِ manifestِ SDK از طریقِ manifest-merger اضافه می‌شوند، پس این‌جا
// دستی تزریق نمی‌شوند. درخواستِ Runtimeِ POST_NOTIFICATIONS در Android 13+ سمتِ JS
// انجام می‌شود (src/core/notifications).
const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withProjectBuildGradle,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');

// مختصاتِ وابستگی طبقِ README مخزنِ SDK. برای بیلدِ release بهتر است به‌جای
// main-SNAPSHOT یک هشِ کامیت پین شود (JitPack از هشِ کامیت هم پشتیبانی می‌کند).
const SDK_COORDINATE = 'com.github.spellads-ir:fetchy_sdk:main-SNAPSHOT';
const DEP_MARKER = 'FETCHY_SDK_DEP';
const JITPACK_URL = 'https://www.jitpack.io';
// آینه‌ی بازِ Aliyun از مخزنِ Google (androidx) — جایگزینِ dl.google.comِ فیلترشده.
const ALIYUN_GOOGLE_MIRROR = 'https://maven.aliyun.com/repository/google';

// Fetchy → WorkManager (work-runtime) وابسته به androidx.lifecycle:lifecycle-service
// است. الاینمنتِ گروهِ androidx.lifecycle این ماژول را به نسخه‌ی سایرِ ماژول‌های
// lifecycle (که Expo/RN لازم دارند، مثلاً 2.10.0) بالا می‌برد — ولی lifecycle-service
// در آن نسخه منتشر نشده و 404 می‌شود. کلاً از گراف حذفش می‌کنیم:
// کلاسِ LifecycleService فقط برای foreground-serviceِ WorkManager لازم است که Fetchy
// (که از CoroutineWorkerِ periodic/one-time استفاده می‌کند) هرگز آن را اجرا نمی‌کند،
// و چون minify در release خاموش است، R8 هم به کلاسِ غایب گیر نمی‌دهد.
const PIN_MARKER = 'FETCHY_LIFECYCLE_SERVICE_EXCLUDE';

// ۱) وابستگیِ Gradle در app/build.gradle
function withFetchyGradleDependency(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let src = cfg.modResults.contents;
    if (src.includes(DEP_MARKER)) return cfg; // idempotent

    src = src.replace(
      /dependencies\s*\{\n/,
      (m) => `${m}    implementation("${SDK_COORDINATE}") // ${DEP_MARKER}\n`
    );

    // حذفِ lifecycle-service از کلِ گراف (رفعِ 404ِ الاینمنت روی نسخه‌ی منتشرنشده).
    if (!src.includes(PIN_MARKER)) {
      src += `\n// ${PIN_MARKER}\nconfigurations.all {\n    exclude group: 'androidx.lifecycle', module: 'lifecycle-service'\n}\n`;
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

// ۲) ریپازیتوری‌های اضافی در build.gradleِ ریشه (idempotent، مقاوم به prebuild --clean):
//    - JitPack: برای خودِ fetchy_sdk
//    - آینه‌ی Google روی Aliyun: چون dl.google.com روی شبکه‌ی توسعه فیلتر است و
//      404 برمی‌گرداند، artifactهای androidx از این آینه‌ی بازِ Aliyun گرفته می‌شوند
//      (قبل از google() تا سریع‌تر resolve شود). این وابستگی به پروکسیِ SOCKS را حذف می‌کند.
function withExtraRepositories(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let src = cfg.modResults.contents;

    const inject = [];
    if (!src.includes('aliyun.com/repository/google')) {
      inject.push(`    maven { url '${ALIYUN_GOOGLE_MIRROR}' }`);
    }
    if (!src.includes('jitpack.io')) {
      inject.push(`    maven { url '${JITPACK_URL}' }`);
    }
    if (inject.length === 0) return cfg;

    src = src.replace(
      /allprojects\s*\{\s*\n\s*repositories\s*\{\n/,
      (m) => `${m}${inject.join('\n')}\n`
    );

    cfg.modResults.contents = src;
    return cfg;
  });
}

// ۳) نوشتنِ fetchy-config.json در assetsِ اندروید.
//    منبعِ کانفیگ به‌ترتیب: plugins/fetchy-config.json (محلی، gitignore شده چون
//    api_key محرمانه است) و اگر نبود plugins/fetchy-config.sample.json.
//    متغیرِ محیطیِ FETCHY_API_KEY (اگر ست باشد) روی api_key اولویت دارد — برای CI
//    و کلونِ تازه که فایلِ محلی را ندارند.
function withFetchyConfigAsset(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const pluginsDir = path.join(cfg.modRequest.projectRoot, 'plugins');
      const localConfig = path.join(pluginsDir, 'fetchy-config.json');
      const sampleConfig = path.join(pluginsDir, 'fetchy-config.sample.json');
      const source = fs.existsSync(localConfig) ? localConfig : sampleConfig;

      const parsed = JSON.parse(fs.readFileSync(source, 'utf8'));
      const envKey = process.env.FETCHY_API_KEY;
      if (envKey) {
        parsed.pull = parsed.pull || {};
        parsed.pull.api_key = envKey;
      }

      const apiKey = parsed.pull && parsed.pull.api_key;
      if (!apiKey || apiKey === 'YOUR_FETCHY_API_KEY') {
        throw new Error(
          'Fetchy: api_key تنظیم نشده. یا plugins/fetchy-config.json را بساز ' +
            '(از روی fetchy-config.sample.json) یا FETCHY_API_KEY را ست کن.'
        );
      }

      const assetsDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets'
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, 'fetchy-config.json'),
        JSON.stringify(parsed, null, 2) + '\n'
      );
      return cfg;
    },
  ]);
}

// ۴) Fetchy.initialize(this) در MainApplication.onCreate
function withFetchyInit(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';

    // import
    const importLine = 'import com.fetchy.sdk.Fetchy';
    if (!src.includes(importLine)) {
      // بعد از خطِ package تزریق کن
      src = src.replace(/(^package .*\n)/m, `$1\n${importLine}\n`);
    }

    // فراخوانی: بعد از super.onCreate() یک بار initialize کن
    const initCall = isKotlin ? 'Fetchy.initialize(this)' : 'Fetchy.initialize(this);';
    if (!src.includes('Fetchy.initialize')) {
      src = src.replace(
        /(super\.onCreate\(\)\n)/,
        `$1    ${initCall}\n`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withFetchySdk(config) {
  config = withExtraRepositories(config);
  config = withFetchyGradleDependency(config);
  config = withFetchyConfigAsset(config);
  config = withFetchyInit(config);
  return config;
};
