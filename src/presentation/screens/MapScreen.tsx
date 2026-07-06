import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { LeafletWebView, type LeafletEvent } from '@/presentation/components/LeafletWebView';
import { useCases } from '@/core/di/DIProvider';
import { useMapViewModel } from '@/presentation/hooks/useMapViewModel';
import type { MapUser } from '@/domain/entities';
import { colors, fonts, fontSizes, spacing, radius, shadow } from '@/core/theme';

// فاصله را برای نمایش قالب‌بندی می‌کند (متر → «۱٫۲ کیلومتر» / «۳۰۰ متر»).
function formatDistance(m?: number): string | null {
  if (m == null) return null;
  if (m >= 1000) return `${(m / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} کیلومتر`;
  return `${m.toLocaleString('fa-IR')} متر`;
}

// HTML ثابتِ نقشه‌ی Leaflet. نشانگرها بعداً با postMessage تزریق می‌شوند تا
// نیازی به بازسازیِ WebView نباشد. تایل‌ها از OpenStreetMap با فیلترِ تیره.
const MAP_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0F0A0C; }
    .leaflet-tile { filter: brightness(0.7) invert(0.92) contrast(0.9) hue-rotate(180deg) saturate(0.6) brightness(0.9); }
    .leaflet-container { background: #0F0A0C; }
    .me-dot { width: 18px; height: 18px; border-radius: 50%; background: #DAB877; border: 3px solid #2A1D12; box-shadow: 0 0 0 4px rgba(218,184,119,0.35); }
    .pin { width: 40px; height: 40px; border-radius: 50% 50% 50% 0; background: #DAB877; border: 2px solid #2A1D12; transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,0.5); overflow: hidden; }
    .pin.match { background: #FF6F80; }
    .pin img { width: 100%; height: 100%; object-fit: cover; transform: rotate(45deg) scale(1.4); }
    .pin .ph { transform: rotate(45deg); color: #2A1D12; font: 700 16px sans-serif; text-align: center; line-height: 36px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([35.7, 51.4], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var meMarker = null;
    var markers = [];

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
      if (data.me) {
        var meIcon = L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
        if (meMarker) map.removeLayer(meMarker);
        meMarker = L.marker([data.me.lat, data.me.lng], { icon: meIcon, interactive: false }).addTo(map);
        map.setView([data.me.lat, data.me.lng], 13);
      }
      clearMarkers();
      (data.users || []).forEach(function (u) {
        var inner = u.photoUrl
          ? '<img src="' + u.photoUrl + '" />'
          : '<div class="ph">' + (u.name ? u.name.charAt(0) : '؟') + '</div>';
        var icon = L.divIcon({
          className: '',
          html: '<div class="pin ' + (u.isMatch ? 'match' : '') + '">' + inner + '</div>',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
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

export function MapScreen() {
  const uc = useCases();
  const vm = useMapViewModel();
  const [selected, setSelected] = useState<MapUser | null>(null);
  const [swiping, setSwiping] = useState(false);

  const payload = useMemo(
    () => JSON.stringify({ me: vm.me, users: vm.users }),
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

  // ---- حالت‌های خاص ----
  if (vm.loading && vm.users.length === 0) {
    return (
      <ScreenContainer style={styles.center}>
        <ScreenHeader title="نقشه" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </ScreenContainer>
    );
  }

  if (vm.permissionState === 'denied') {
    return (
      <ScreenContainer style={styles.padded}>
        <ScreenHeader title="نقشه" />
        <View style={styles.center}>
          <EmptyState
            icon="map"
            title="موقعیتت روشن نیست"
            hint="برای دیدنِ کاربرانِ نزدیک روی نقشه، دسترسی به موقعیت لازم است."
          />
          <Pressable style={styles.cta} onPress={vm.refresh} accessibilityRole="button">
            <Icon name="map" size={16} tint="gold" />
            <Text style={styles.ctaText}>روشن کردنِ موقعیت</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush style={styles.wrap}>
      <View style={styles.headerRow}>
        <ScreenHeader title="نقشه" subtitle="کاربرانِ نزدیکِ تو" />
      </View>

      <View style={styles.mapArea}>
        <LeafletWebView html={MAP_HTML} payload={payload} onEvent={onEvent} />

        {vm.error && vm.users.length === 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ارتباط با سرور ناموفق بود ({vm.error})</Text>
          </View>
        ) : !vm.loading && vm.users.length === 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>فعلاً کسی این نزدیکی روی نقشه نیست</Text>
          </View>
        ) : null}

        <Pressable style={styles.refresh} onPress={vm.refresh} accessibilityLabel="تازه‌سازی">
          <Icon name="rewind" size={18} tint="gold" />
        </Pressable>
      </View>

      {selected ? (
        <View style={styles.sheetWrap}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)} />
          <View style={[styles.sheet, shadow.gold]}>
            <View style={styles.sheetRow}>
              <Avatar uri={selected.photoUrl} name={selected.name} size={64} ring />
              <View style={styles.sheetInfo}>
                <Text style={styles.sheetName}>
                  {selected.name}
                  {selected.age ? `، ${selected.age.toLocaleString('fa-IR')}` : ''}
                </Text>
                {formatDistance(selected.distanceM) ? (
                  <Text style={styles.sheetDist}>{formatDistance(selected.distanceM)}</Text>
                ) : null}
                {selected.isMatch ? <Text style={styles.sheetMatch}>با هم مَچ شده‌اید</Text> : null}
              </View>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Icon name="close" size={20} tint="white" style={{ opacity: 0.6 }} />
              </Pressable>
            </View>

            <View style={styles.sheetActions}>
              {selected.isMatch ? (
                <Pressable
                  style={[styles.actionBtn, styles.actionPrimary, shadow.gold]}
                  onPress={() => {
                    setSelected(null);
                    router.push('/chat');
                  }}
                >
                  <Text style={styles.actionPrimaryText}>گفتگو</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.actionBtn, styles.actionPrimary, shadow.gold]}
                  onPress={like}
                  disabled={swiping}
                >
                  <Icon name="heart-fill" size={18} tint="ink" />
                  <Text style={styles.actionPrimaryText}>پسندیدن</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  padded: { paddingHorizontal: 18 },
  headerRow: { paddingHorizontal: 18 },
  mapArea: { flex: 1, overflow: 'hidden' },
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
  refresh: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  ctaText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  sheetWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,8,10,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sheetRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  sheetInfo: { flex: 1, alignItems: 'flex-end' },
  sheetName: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'right' },
  sheetDist: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, marginTop: 2 },
  sheetMatch: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.rose, marginTop: 2 },
  sheetActions: { flexDirection: 'row-reverse', gap: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
  },
  actionPrimary: { backgroundColor: colors.gold },
  actionPrimaryText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.onGold },
});
