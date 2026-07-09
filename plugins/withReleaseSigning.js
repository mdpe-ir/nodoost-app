// Config plugin برای امضای نسخه‌ی release (برای APKِ کافه‌بازار).
//
// چون پوشه‌ی android/ توسطِ `expo prebuild` بازتولید (و git-ignore) می‌شود، امضای
// release نمی‌تواند به‌صورتِ دستی در build.gradle بماند؛ این پلاگین آن را در زمانِ
// prebuild تزریق می‌کند. مقادیرِ کی‌استور از propertyهای Gradle خوانده می‌شوند
// (اسکریپتِ build آن‌ها را با -P پاس می‌دهد؛ رمزها هرگز در repo نوشته نمی‌شوند):
//   NODOOST_RELEASE_STORE_FILE / _STORE_PASSWORD / _KEY_ALIAS / _KEY_PASSWORD
// اگر propertyها نباشند (مثلاً در `expo run:android`ِ dev)، release روی امضای
// debug می‌ماند تا build دِو نشکند.
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = 'NODOOST_RELEASE_STORE_FILE';

const RELEASE_SIGNING_CONFIG = `        release {
            if (project.hasProperty('${MARKER}')) {
                storeFile file(project.property('${MARKER}'))
                storePassword project.property('NODOOST_RELEASE_STORE_PASSWORD')
                keyAlias project.property('NODOOST_RELEASE_KEY_ALIAS')
                keyPassword project.property('NODOOST_RELEASE_KEY_PASSWORD')
            }
        }
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let src = cfg.modResults.contents;

    if (src.includes(MARKER)) return cfg; // idempotent

    // ۱) یک signingConfig به‌نامِ release داخلِ بلاکِ signingConfigs اضافه کن.
    src = src.replace(/signingConfigs\s*\{\n/, (m) => m + RELEASE_SIGNING_CONFIG);

    // ۲) فقط buildTypeِ release را به signingConfigs.release وصل کن (وقتی کی‌استور
    //    پاس داده شده). با لنگر روی کامنتِ «Caution!» تا debug دست‌نخورده بماند.
    src = src.replace(
      /(\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('${MARKER}') ? signingConfigs.release : signingConfigs.debug`
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
