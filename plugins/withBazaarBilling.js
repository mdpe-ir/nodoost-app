// Config plugin برای پرداختِ درون‌برنامه‌ایِ کافه‌بازار (Poolakey).
//
// کتابخانه‌ی @cafebazaar/react-native-poolakey خودش این‌ها را به AndroidManifest
// اضافه نمی‌کند، پس در زمانِ `expo prebuild` این‌جا تزریق می‌شوند:
//   ۱) مجوزِ PAY_THROUGH_BAZAAR
//   ۲) بلاکِ <queries> برای دیده‌شدنِ پکیجِ بازار در اندروید ۱۱+ (بدونِ آن، اتصال
//      به سرویسِ پرداختِ بازار بی‌صدا شکست می‌خورد).
const { withAndroidManifest } = require('@expo/config-plugins');

const BAZAAR_PERMISSION = 'com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR';
const BAZAAR_PACKAGE = 'com.farsitel.bazaar';

module.exports = function withBazaarBilling(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // ۱) مجوزِ پرداختِ بازار
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const hasPerm = manifest['uses-permission'].some(
      (p) => p.$ && p.$['android:name'] === BAZAAR_PERMISSION
    );
    if (!hasPerm) {
      manifest['uses-permission'].push({ $: { 'android:name': BAZAAR_PERMISSION } });
    }

    // ۲) <queries><package android:name="com.farsitel.bazaar" /></queries>
    manifest.queries = manifest.queries || [];
    let q = manifest.queries[0];
    if (!q) {
      q = {};
      manifest.queries.push(q);
    }
    q.package = q.package || [];
    const hasPkg = q.package.some((p) => p.$ && p.$['android:name'] === BAZAAR_PACKAGE);
    if (!hasPkg) {
      q.package.push({ $: { 'android:name': BAZAAR_PACKAGE } });
    }

    return cfg;
  });
};
