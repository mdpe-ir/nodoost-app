import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { PressableScale } from '@/presentation/components/PressableScale';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScreenContainer, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { GridSkeleton } from '@/presentation/components/Skeleton';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { PhotoPicker } from '@/presentation/components/PhotoPicker';
import { tierName } from '@/presentation/components/TierBadge';
import { maxPhotosForTier } from '@/presentation/tiers/tierFeatures';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import type { Photo } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

const COLS = 3;
const GAP = 2;

/**
 * مدیریتِ عکس‌ها — افزودن، حذف، انتخابِ عکسِ اصلی و دیدنِ دلیلِ رد.
 *
 * پیش‌تر زبانه‌ی نخستِ صفحه‌ی «من» بود و شبکه‌ی تمام‌عرضش نیمی از صفحه را
 * می‌گرفت. حالا صفحه‌ی خودش را دارد؛ صفحه‌ی «من» فقط یک نوارِ پیش‌نمایش نشان
 * می‌دهد و برای هر کاری به این‌جا می‌آورد.
 */
export function PhotosScreen() {
  const vm = useProfileViewModel();
  const { width } = useWindowDimensions();
  const tile = (width - GAP * (COLS - 1)) / COLS;
  // عکسِ بازشده در نمای تمام‌صفحه — خودِ عکس (نه فقط آدرسش) تا کنشِ «عکسِ اصلی» را هم بشود داد.
  const [viewer, setViewer] = useState<Photo | null>(null);

  const userTier = vm.user?.tier ?? 1;
  const activeTierName = tierName(userTier) || 'رایگان';
  const maxPhotos = maxPhotosForTier(userTier);
  // عکس‌های ردشده در سقف حساب نمی‌شوند (مطابقِ سرور).
  const countedPhotos = vm.photos.filter((p) => p.status !== 'rejected').length;
  const rejected = vm.photos.filter((p) => p.status === 'rejected' && p.rejectionReason);

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="عکس‌های من" />
        <GridSkeleton count={6} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush>
      <View style={styles.padded}>
        <StackHeader title="عکس‌های من" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {vm.photos.map((p) => {
            const uri = mediaUrl(p.url);
            const pending = p.status === 'pending' || p.status == null;
            const isRejected = p.status === 'rejected';
            return (
              <PressableScale
                scaleTo={0.98}
                feedback="select"
                key={p.id}
                style={[styles.tile, { width: tile, height: tile }]}
                onPress={() => uri && setViewer(p)}
                disabled={!uri}
                accessibilityRole="imagebutton"
                accessibilityLabel="نمایشِ کاملِ عکس"
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={[styles.photo, (pending || isRejected) && styles.photoDim]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : null}
                {p.isPrimary ? (
                  <View style={styles.primaryTag}><Text style={styles.primaryTagText}>اصلی</Text></View>
                ) : null}
                {pending ? (
                  <View style={styles.statusTag}>
                    <Icon name="clock" size={11} tint="ink" />
                    <Text style={styles.statusText}>در انتظار</Text>
                  </View>
                ) : null}
                {isRejected ? (
                  <View style={[styles.statusTag, styles.statusTagReject]}><Text style={styles.statusText}>رد شد</Text></View>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.del, pressed && styles.delPressed]}
                  onPress={() => vm.deletePhoto(p.id)}
                  disabled={vm.busy}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="حذفِ عکس"
                >
                  <Icon name="close" size={14} tint="white" />
                </Pressable>
              </PressableScale>
            );
          })}

          {countedPhotos < maxPhotos ? (
            <PressableScale
              scaleTo={0.98}
              feedback="select"
              style={[styles.tile, styles.addTile, { width: tile, height: tile }]}
              onPress={() => vm.addPhoto()}
              disabled={vm.busy}
              accessibilityRole="button"
              accessibilityLabel="افزودنِ عکس"
            >
              <Icon name="plus" size={24} tint="gold" />
              <Text style={styles.addTileText}>افزودن</Text>
            </PressableScale>
          ) : userTier < 5 ? (
            // سقفِ سطحِ فعلی پر شده — کاشیِ قفل، دعوت به ارتقا.
            <PressableScale
              scaleTo={0.98}
              feedback="select"
              style={[styles.tile, styles.addTile, styles.lockTile, { width: tile, height: tile }]}
              onPress={() =>
                router.push({
                  pathname: '/plans',
                  params: { required: String(userTier + 1), feature: 'آپلودِ عکس‌های بیشتر' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="افزایشِ سقفِ عکس با ارتقای سطح"
            >
              <Icon name="lock" size={22} tint="gold" />
              <Text style={styles.addTileText}>عکسِ بیشتر با ارتقا</Text>
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.padded}>
          {/* خطای آپلود/حذف دیگر بی‌صدا بلعیده نمی‌شود. */}
          {vm.photoError ? <Text style={styles.photoError}>{vm.photoError}</Text> : null}
          <Text style={styles.caption}>
            {faNum(countedPhotos)} از {faNum(maxPhotos)} عکسِ سطحِ {activeTierName} استفاده شده.
            {' '}عکس‌های تازه بلافاصله نمایش داده می‌شوند. برای انتخابِ عکسِ اصلی، روی عکس بزن.
          </Text>
          {rejected.map((photo) => (
            <View key={`reason-${photo.id}`} style={styles.rejectionRow}>
              <Icon name="close" size={12} tint="white" />
              <Text style={styles.rejectionReason}>دلیلِ رد: {photo.rejectionReason}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* — نمایِ تمام‌صفحه‌ی عکس — */}
      <Modal
        visible={viewer != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewer(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)}>
          {viewer ? (
            <Image source={{ uri: mediaUrl(viewer.url) }} style={styles.viewerImage} contentFit="contain" transition={150} cachePolicy="memory-disk" />
          ) : null}
          <Pressable style={styles.viewerClose} onPress={() => setViewer(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="بستن">
            <Icon name="close" size={20} tint="white" />
          </Pressable>
          {viewer && !viewer.isPrimary && viewer.status !== 'rejected' ? (
            <View style={styles.viewerDock}>
              <Button
                label="عکسِ پروفایلم شود"
                icon="check"
                loading={vm.primaryBusyId === viewer.id}
                onPress={async () => {
                  const ok = await vm.setPrimaryPhoto(viewer.id);
                  if (ok) setViewer(null);
                }}
              />
            </View>
          ) : null}
        </Pressable>
      </Modal>

      {/* برگه‌ی دوربین/گالری + ویرایشگرِ برش — همان جریانی که در تکمیلِ پروفایل است. */}
      <PhotoPicker
        visible={vm.pickerOpen}
        onClose={vm.closePicker}
        onPicked={vm.onPhotoPicked}
        onError={vm.setPhotoError}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: PAGE_PADDING },
  scroll: { paddingBottom: spacing.xxl },

  // — شبکه‌ی تمام‌عرض (لبه‌تا‌لبه) — سلول‌های مربعیِ نزدیک‌به‌هم.
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: GAP, marginTop: spacing.sm },
  tile: { backgroundColor: colors.surface2, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoDim: { opacity: 0.45 },
  primaryTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  primaryTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.onGold },
  statusTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 3,
    backgroundColor: colors.goldFaint,
  },
  statusTagReject: { backgroundColor: 'rgba(120,20,30,0.55)' },
  statusText: { fontFamily: fonts.medium, fontSize: 10, color: colors.ink },
  del: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delPressed: { transform: [{ scale: 0.9 }] },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  addTileText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2, textAlign: 'center', writingDirection: 'rtl' },
  lockTile: { borderStyle: 'solid', opacity: 0.85, paddingHorizontal: spacing.xs },

  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: lineHeights.xs,
    marginTop: spacing.md,
  },
  photoError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.md,
  },
  rejectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.roseFaint,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectionReason: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.rose, textAlign: 'right' },

  // — لایت‌باکس —
  viewerBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  viewerClose: {
    position: 'absolute',
    top: 44,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl,
    paddingHorizontal: PAGE_PADDING,
  },
});
