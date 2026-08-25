import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import {
  CARD_SIZES,
  ShareCardView,
  type ShareCardFormat,
  type ShareCardLook,
} from '@/presentation/components/ShareCardView';
import { useShareCard } from '@/presentation/hooks/useShareCard';
import { inviteShareCaption, useInviteViewModel } from '@/presentation/hooks/useInviteViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { mediaUrl } from '@/core/http/mediaUrl';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

const FORMATS: { key: ShareCardFormat; label: string }[] = [
  { key: 'story', label: 'استوری' },
  { key: 'feed', label: 'پست' },
  { key: 'x', label: 'ایکس' },
];

const LOOKS: { key: ShareCardLook; label: string }[] = [
  { key: 'photo', label: 'عکس' },
  { key: 'code', label: 'کد' },
  { key: 'portrait', label: 'چهره' },
];

/**
 * استودیوی کارتِ دعوت — فرمت و ظاهر را انتخاب می‌کنی، کپشن را ویرایش
 * می‌کنی، و یک PNG با برگه‌ی سیستم می‌فرستی. ثبتِ تصویر نیتیو است؛ روی وب
 * این صفحه باز نمی‌شود.
 */
export function ShareCardScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const vm = useInviteViewModel();
  const { user } = useSession();
  const { viewRef, share, sharing, toast, clearToast } = useShareCard();

  const [format, setFormat] = useState<ShareCardFormat>('story');
  const [look, setLook] = useState<ShareCardLook>('photo');
  const [captionEdit, setCaptionEdit] = useState<string | null>(null);

  const summary = vm.data?.summary;
  const code = summary?.code ?? '';
  const name = user?.name?.trim() ?? '';
  const photoUrl = mediaUrl(
    user?.photos?.find((p) => p.isPrimary)?.url ?? user?.photos?.[0]?.url
  );
  const caption = captionEdit ?? (summary ? inviteShareCaption(summary) : '');

  const cardKey = `${format}-${look}-${photoUrl ?? ''}`;
  const needsPhoto = (look === 'photo' || look === 'portrait') && Boolean(photoUrl);
  const [readyKey, setReadyKey] = useState(cardKey);
  const [photoReady, setPhotoReady] = useState(!needsPhoto);
  if (readyKey !== cardKey) {
    setReadyKey(cardKey);
    setPhotoReady(!needsPhoto);
  }
  const onCardReady = useCallback(() => setPhotoReady(true), []);
  const cardReady = !needsPhoto || photoReady;

  useEffect(() => {
    if (!needsPhoto) return;
    const t = setTimeout(() => setPhotoReady(true), 2500);
    return () => clearTimeout(t);
  }, [cardKey, needsPhoto]);

  const cardSize = CARD_SIZES[format];
  const maxPreviewW = screenW - PAGE_PADDING * 2;
  const maxPreviewH = Math.min(screenH * 0.34, 360);
  const previewScale = Math.min(maxPreviewW / cardSize.width, maxPreviewH / cardSize.height);
  const previewW = cardSize.width * previewScale;
  const previewH = cardSize.height * previewScale;

  if (Platform.OS === 'web') {
    return (
      <ScreenContainer>
        <StackHeader title="ساخت پست" />
        <EmptyState
          icon="star"
          title="ساخت پست فقط در اپِ موبایل است"
          hint="از نسخهٔ اندروید یا iOS کارت بساز."
        />
      </ScreenContainer>
    );
  }

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="ساخت پست" />
        <RowsSkeleton />
      </ScreenContainer>
    );
  }

  if (vm.error || !summary?.enabled || !code) {
    return (
      <ScreenContainer>
        <StackHeader title="ساخت پست" />
        <EmptyState
          icon="rewind"
          title="بارگذاری نشد"
          hint="اتصالت را بررسی کن."
          actionLabel="تلاشِ دوباره"
          onAction={vm.reload}
        />
      </ScreenContainer>
    );
  }

  const cardProps = { look, name, code, photoUrl };

  return (
    <ScreenContainer>
      {/* کارتِ تمام‌رزولوشن خارج از دید می‌نشیند تا view-shot از روی پیکسلِ واقعی ثبت کند. */}
      <View
        ref={viewRef}
        collapsable={false}
        pointerEvents="none"
        style={[styles.captureHost, { width: cardSize.width, height: cardSize.height }]}
      >
        <ShareCardView
          {...cardProps}
          width={cardSize.width}
          height={cardSize.height}
          onReady={onCardReady}
        />
      </View>

      <View style={styles.ui}>
        <StackHeader title="ساخت پست" />

        <KeyboardAwareScrollView
          bottomOffset={spacing.xxl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>فرمت</Text>
            <SegmentedControl options={FORMATS} value={format} onChange={setFormat} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ظاهر</Text>
            <View style={styles.looks}>
              {LOOKS.map((l) => (
                <Chip
                  key={l.key}
                  label={l.label}
                  active={look === l.key}
                  onPress={() => setLook(l.key)}
                  style={{ minHeight: 40, paddingHorizontal: 16 }}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>پیش‌نمایش</Text>
            <View style={[styles.previewWrap, { width: previewW, height: previewH }]}>
              {/*
               * کارت را در ابعاد واقعی می‌کشیم و با scale جمع می‌کنیم تا حاشیه و
               * تایپ در پیش‌نمایشِ کوچک محو/ناپدید نشوند.
               */}
              <View
                pointerEvents="none"
                style={{
                  width: cardSize.width,
                  height: cardSize.height,
                  transform: [{ scale: previewScale }],
                  transformOrigin: 'top left',
                }}
              >
                <ShareCardView
                  {...cardProps}
                  width={cardSize.width}
                  height={cardSize.height}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>کپشن</Text>
            <TextInput
              value={caption}
              onChangeText={setCaptionEdit}
              multiline
              placeholder="متنِ همراهِ پست"
              placeholderTextColor={colors.ink3}
              style={styles.caption}
              textAlign="right"
            />
            <Text style={styles.captionHint}>
              کپشن هنگامِ اشتراک‌گذاری کپی می‌شود؛ در اینستاگرام پیست کن.
            </Text>
          </View>
        </KeyboardAwareScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            label="اشتراک‌گذاری"
            icon="send-fill"
            loading={sharing}
            disabled={!cardReady}
            onPress={() => void share(caption)}
          />
        </View>
      </View>

      {toast ? (
        <Pressable style={styles.toast} onPress={clearToast}>
          <Text style={styles.toastText}>{toast}</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  captureHost: {
    position: 'absolute',
    // خارج از دید — opacity صفر ثبتِ view-shot را خراب می‌کند.
    left: -4096,
    top: 0,
    zIndex: 0,
  },
  ui: {
    flex: 1,
    zIndex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  looks: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  previewWrap: {
    alignSelf: 'center',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  caption: {
    minHeight: 96,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    writingDirection: 'rtl',
    textAlignVertical: 'top',
  },
  captionHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl,
    zIndex: 2,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toastText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
