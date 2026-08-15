import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Image } from 'expo-image';
import { Icon } from './Icon';
import { mediaUrl } from '@/core/http/mediaUrl';
import type { Photo } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** فاصله‌ی سُرخوردنِ برگه از پایینِ صفحه؛ از بلندترین حالتِ برگه بیشتر است. */
const THUMB = 84;

interface Props {
  visible: boolean;
  /** همه‌ی عکس‌های کاربر؛ ردشده‌ها این‌جا فیلتر می‌شوند. */
  photos: Photo[];
  /** عکسی که همین حالا در حالِ اصلی‌شدن است. */
  busyId: number | null;
  /** پیامِ خطای آخرین تلاش (اگر باشد). */
  error: string | null;
  /** آیا هنوز جا برای عکسِ تازه هست؟ (سقفِ سطحِ عضویت) */
  canAdd: boolean;
  /** true یعنی عوض شد و برگه بسته می‌شود. */
  onSelect: (id: number) => Promise<boolean>;
  onAddNew: () => void;
  onDismiss: () => void;
}

/**
 * برگه‌ی «عکسِ پروفایل» — انتخابِ عکسِ پیش‌فرض از میانِ عکس‌های موجود، یا گرفتنِ
 * یک عکسِ تازه.
 *
 * چرا برگه و نه صفحه: عوض‌کردنِ عکسِ پروفایل یک تصمیمِ یک‌ضربه‌ای است؛ کاربر
 * روی آواتارش می‌زند، عکسِ تازه را انتخاب می‌کند و همان‌جا نتیجه را می‌بیند —
 * بدونِ رفتن به زبانه‌ی عکس‌ها و بدونِ منوی چندمرحله‌ای.
 */
export function ProfilePhotoSheet({
  visible,
  photos,
  busyId,
  error,
  canAdd,
  onSelect,
  onAddNew,
  onDismiss,
}: Props) {

  // عکسِ ردشده نمی‌تواند چهره‌ی پروفایل شود؛ اصلاً نشانش نمی‌دهیم.
  const usable = photos.filter((p) => p.status !== 'rejected');

  const pick = async (id: number) => {
    if (busyId != null) return;
    if (await onSelect(id)) onDismiss();
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
          <Text style={styles.title}>عکسِ پروفایل</Text>
          <Text style={styles.sub}>
            {usable.length > 0
              ? 'یکی از عکس‌هایت را بزن تا چهره‌ی پروفایلت شود — همان عکسی که دیگران اول از همه می‌بینند.'
              : 'هنوز عکسی نداری. اولین عکست همان‌جا عکسِ پروفایلت می‌شود.'}
          </Text>

          {/* شبکه‌ی سطرشکن، نه نوارِ افقی: همه‌ی عکس‌ها یکجا دیده می‌شوند و
              چیدمانِ راست‌به‌چپ با کم‌بودنِ عکس‌ها هم به لبه‌ی درست می‌چسبد. */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.strip}
            style={styles.stripBox}
          >
            {canAdd ? (
              <Pressable
                onPress={onAddNew}
                style={({ pressed }) => [styles.thumb, styles.addThumb, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="گرفتنِ عکسِ تازه برای پروفایل"
              >
                <Icon name="plus" size={22} tint="gold" />
                <Text style={styles.addText}>عکسِ تازه</Text>
              </Pressable>
            ) : null}

            {usable.map((p) => {
              const uri = mediaUrl(p.url);
              const busy = busyId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => pick(p.id)}
                  disabled={busyId != null}
                  style={({ pressed }) => [
                    styles.thumb,
                    p.isPrimary && styles.thumbActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: p.isPrimary }}
                  accessibilityLabel={p.isPrimary ? 'عکسِ فعلیِ پروفایل' : 'انتخابِ این عکس برای پروفایل'}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : null}
                  {p.isPrimary && !busy ? (
                    <View style={styles.check}>
                      <Icon name="check" size={13} tint="ink" />
                    </View>
                  ) : null}
                  {busy ? (
                    <View style={styles.thumbBusy}>
                      <ActivityIndicator color={colors.gold} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!canAdd ? (
            <Text style={styles.note}>
              سقفِ عکسِ سطحت پر است؛ برای افزودنِ عکسِ تازه یکی از عکس‌ها را پاک کن.
            </Text>
          ) : null}

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          >
            <Text style={styles.cancelText}>بستن</Text>
          </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },


  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sub: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // شبکه‌ی عکس‌ها — تا سه سطر بازتر می‌شود و بعد خودش اسکرول می‌کند.
  stripBox: { marginTop: spacing.lg, maxHeight: THUMB * 3 + spacing.sm * 2 },
  strip: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: colors.gold },
  thumbBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,5,11,0.55)',
  },
  check: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderColor: colors.goldSoft,
    borderStyle: 'dashed',
    backgroundColor: colors.goldFaint,
  },
  addText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.gold2,
    writingDirection: 'rtl',
  },

  error: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  note: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  cancel: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
});
