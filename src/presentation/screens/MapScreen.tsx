import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { EmptyState } from '@/presentation/components/EmptyState';
import { MapSkeleton } from '@/presentation/components/Skeleton';
import { Avatar } from '@/presentation/components/Avatar';
import { Button } from '@/presentation/components/Button';
import { IconButton } from '@/presentation/components/IconButton';
import { LeafletWebView, type LeafletEvent } from '@/presentation/components/LeafletWebView';
import { TierBadge } from '@/presentation/components/TierBadge';
import { useCases } from '@/core/di/DIProvider';
import { useMapViewModel } from '@/presentation/hooks/useMapViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faDistance } from '@/core/utils/faNum';
import type { MapUser } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

// HTML ثابتِ نقشه‌ی Leaflet. نشانگرها بعداً با postMessage تزریق می‌شوند تا
// نیازی به بازسازیِ WebView نباشد. تایل‌ها از OpenStreetMap با فیلترِ تیره.
// رنگ‌ها از پالتِ تم تزریق می‌شوند تا دو نسخه‌ی حقیقت نداشته باشیم.
const MAP_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${colors.bg}; }
    /* فیلترِ تیره روی کلِ لایه‌ی تایل‌ها اعمال می‌شود، نه تک‌تکِ تایل‌ها؛ وگرنه
       هر تایل روی لایه‌ی composite جدا با آفستِ کسری می‌نشیند و درزهای بینِ
       تایل‌ها به‌صورتِ خط‌های شبکه‌ای دیده می‌شوند. */
    .leaflet-tile-pane { filter: brightness(0.7) invert(0.92) contrast(0.9) hue-rotate(180deg) saturate(0.6) brightness(0.9); }
    .leaflet-container { background: ${colors.bg}; }
    .pin { width: 44px; height: 52px; position: relative; }
    .pin .av { position: relative; width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: ${colors.gold}; border: 3px solid ${colors.gold}; box-shadow: 0 2px 6px rgba(0,0,0,0.5); box-sizing: border-box; }
    .pin.match .av { background: ${colors.rose}; border-color: ${colors.rose}; }
    .pin .av img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
    .pin .tail { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid ${colors.gold}; }
    .pin.match .tail { border-top-color: ${colors.rose}; }
    .pin .ph { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: ${colors.onGold}; font: 700 18px sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([35.7, 51.4], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var markers = [];
    var centered = false;
    // رنگِ حلقه‌ی هر نشانگر از سطحِ عضویتِ کاربر می‌آید (مچ‌ها رز می‌مانند).
    var TIER_COLORS = { 1: '${colors.tierNormal}', 2: '${colors.tierBronze}', 3: '${colors.tierSilver}', 4: '${colors.tierGold}', 5: '${colors.tierDiamond}' };

    function post(msg) {
      var s = JSON.stringify(msg);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
      else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
    }

    function clearMarkers() {
      markers.forEach(function (m) { map.removeLayer(m); });
      markers = [];
    }

    function render(data) {
      // موقعیتِ خودِ کاربر روی نقشه نشانگر ندارد؛ فقط یک‌بار نقشه را روی آن مرکز
      // می‌کنیم تا با هر تازه‌سازی، نمای کاربر به عقب نپرد.
      if (data.me && !centered) {
        map.setView([data.me.lat, data.me.lng], 13);
        centered = true;
      }
      clearMarkers();
      (data.users || []).forEach(function (u) {
        // حرفِ اول همیشه پس‌زمینه است؛ عکس رویش می‌نشیند و اگر لود نشد (onerror)
        // حذف می‌شود تا به‌جای عکسِ شکسته، حرفِ اول دیده شود.
        var initial = u.name ? u.name.charAt(0) : '؟';
        var inner = '<div class="ph">' + initial + '</div>' +
          (u.photoUrl ? '<img src="' + u.photoUrl + '" onerror="this.remove()" />' : '');
        var tc = u.isMatch ? '' : (TIER_COLORS[u.tier] || '');
        var avStyle = tc ? ' style="border-color:' + tc + ';background:' + tc + '"' : '';
        var tailStyle = tc ? ' style="border-top-color:' + tc + '"' : '';
        var icon = L.divIcon({
          className: '',
          html: '<div class="pin ' + (u.isMatch ? 'match' : '') + '"><div class="av"' + avStyle + '>' + inner + '</div><div class="tail"' + tailStyle + '></div></div>',
          iconSize: [44, 52],
          iconAnchor: [22, 52],
        });
        var mk = L.marker([u.lat, u.lng], { icon: icon }).addTo(map);
        mk.on('click', function () { post({ type: 'marker', id: u.id }); });
        markers.push(mk);
      });
    }

    document.addEventListener('message', function (e) { try { render(JSON.parse(e.data)); } catch (x) {} });
    window.addEventListener('message', function (e) { try { render(JSON.parse(e.data)); } catch (x) {} });
    post({ type: 'ready' });
  </script>
</body>
</html>`;

/**
 * نمای نقشه‌ی کاربرانِ نزدیک — داخلِ صفحه‌ی «اطراف» رندر می‌شود
 * (هدر و قابِ صفحه را میزبان می‌دهد).
 */
export function MapView() {
  const uc = useCases();
  const vm = useMapViewModel();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<MapUser | null>(null);
  const [swiping, setSwiping] = useState(false);

  const payload = useMemo(
    () =>
      JSON.stringify({
        me: vm.me,
        // آدرسِ عکس باید مطلق باشد؛ داخلِ WebView (که با html خام لود می‌شود) baseِ
        // آدرس ندارد، پس مسیرِ نسبیِ «/uploads/…» حل نمی‌شود و عکس نمایش داده نمی‌شود.
        users: vm.users.map((u) => ({ ...u, photoUrl: mediaUrl(u.photoUrl) })),
      }),
    [vm.me, vm.users]
  );

  // تپِ نشانگر: کارتِ کاربر را باز کن. تزریقِ داده و رویدادِ ready داخلِ
  // LeafletWebView مدیریت می‌شود (نیتیو با webview، وب با iframe).
  const onEvent = useCallback(
    (msg: LeafletEvent) => {
      if (msg.type === 'marker' && msg.id != null) {
        const u = vm.users.find((x) => x.id === msg.id);
        if (u) setSelected(u);
      }
    },
    [vm.users]
  );

  const like = useCallback(async () => {
    if (!selected || swiping) return;
    setSwiping(true);
    try {
      await uc.discovery.swipe(selected.id, 'like');
    } catch {}
    setSwiping(false);
    setSelected(null);
  }, [selected, swiping, uc]);

  if (vm.loading && vm.users.length === 0) {
    return (
      <View style={styles.wrap}>
        <MapSkeleton />
      </View>
    );
  }

  // نقشه فقط با دسترسیِ موقعیت باز می‌شود؛ اگر کاربر اجازه نداده باشد، به‌جای
  // نقشه صفحه‌ی درخواستِ مجوز نشان داده می‌شود تا موقعیت را روشن کند.
  if (vm.permissionState === 'denied') {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="map"
          title="موقعیتت روشن نیست"
          hint="برای دیدنِ نقشه و کاربرانِ فعال، دسترسی به موقعیت لازم است."
          actionLabel="روشن کردنِ موقعیت"
          actionIcon="map"
          onAction={vm.refresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.mapArea}>
        <LeafletWebView html={MAP_HTML} payload={payload} onEvent={onEvent} />

        {vm.error && vm.users.length === 0 ? (
          <Animated.View entering={FadeIn.duration(220)} style={styles.badge}>
            <Text style={styles.badgeText}>ارتباط با سرور ناموفق بود</Text>
          </Animated.View>
        ) : !vm.loading && vm.users.length === 0 ? (
          <Animated.View entering={FadeIn.duration(220)} style={styles.badge}>
            <Text style={styles.badgeText}>هنوز کاربرِ فعالی روی نقشه نیست</Text>
          </Animated.View>
        ) : null}

        <IconButton
          icon="rewind"
          size={48}
          variant="ghost"
          onPress={vm.refresh}
          accessibilityLabel="تازه‌سازی"
          style={styles.refresh}
        />
      </View>

      {selected ? (
        <View style={styles.sheetWrap}>
          <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
            <Pressable
              onPress={() => setSelected(null)}
              style={styles.sheetBackdrop}
              accessibilityLabel="بستن"
            />
          </Animated.View>
          <Animated.View
            entering={FadeInUp.duration(220)}
            style={[styles.sheet, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }, shadow.card]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetRow}>
              <Avatar uri={selected.photoUrl} name={selected.name} size={64} ring />
              <View style={styles.sheetInfo}>
                <View style={styles.sheetNameRow}>
                  <Text style={styles.sheetName} numberOfLines={1}>
                    {selected.name}
                    {selected.age ? `، ${faNum(selected.age)}` : ''}
                  </Text>
                  {selected.tier ? <TierBadge tier={selected.tier} height={18} /> : null}
                </View>
                {faDistance(selected.distanceM) || selected.isOnline != null ? (
                  <Text style={styles.sheetDist}>
                    {[
                      faDistance(selected.distanceM),
                      // «آخرین فعالیت» — سرور فقط برای بیننده‌ی نقره‌ای+ می‌فرستد.
                      selected.isOnline
                        ? 'آنلاین'
                        : selected.lastActiveMin != null
                          ? selected.lastActiveMin < 60
                            ? `فعال ${faNum(Math.max(1, selected.lastActiveMin))} دقیقه پیش`
                            : selected.lastActiveMin < 60 * 24
                              ? `فعال ${faNum(Math.floor(selected.lastActiveMin / 60))} ساعت پیش`
                              : `فعال ${faNum(Math.floor(selected.lastActiveMin / (60 * 24)))} روز پیش`
                          : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
                {selected.isMatch ? <Text style={styles.sheetMatch}>با هم مَچ شده‌اید</Text> : null}
              </View>
              <IconButton
                icon="close"
                size={34}
                variant="surface"
                onPress={() => setSelected(null)}
                accessibilityLabel="بستن"
              />
            </View>

            {selected.isMatch ? (
              <Button
                label="گفتگو"
                icon="tab-chat"
                onPress={() => {
                  setSelected(null);
                  router.push('/chat');
                }}
              />
            ) : (
              <Button label="پسندیدن" icon="heart-fill" onPress={like} loading={swiping} />
            )}
            <Button
              label="دیدنِ پروفایل"
              variant="outline"
              size="md"
              onPress={() => {
                const id = selected.id;
                setSelected(null);
                router.push({ pathname: '/user/[id]', params: { id: String(id) } });
              }}
            />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapArea: { flex: 1, overflow: 'hidden', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  badge: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  refresh: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
  sheetWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  sheetBackdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginTop: -spacing.sm,
  },
  sheetRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  sheetInfo: { flex: 1, alignItems: 'flex-end' },
  sheetNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  sheetName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetDist: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, marginTop: 2 },
  sheetMatch: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.rose, marginTop: 2 },
});
