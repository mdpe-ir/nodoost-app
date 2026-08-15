import React, { useCallback, useState } from 'react';
import { View, Text, Modal, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { PressableScale } from './PressableScale';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { Icon } from './Icon';
import { PhotoSourceSheet, type PhotoSource } from './PhotoSourceSheet';
import { PhotoCropper } from './PhotoCropper';
import { toJpeg } from '@/core/media/normalizeImage';
import { photoErrorMessage } from '@/core/media/photoErrors';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

/**
 * بزرگ‌ترین ضلعِ نسخه‌ای که به ویرایشگر داده می‌شود.
 * از سقفِ آپلود بزرگ‌تر است تا برشِ کوچک هم کیفیتِ کافی داشته باشد.
 */
const EDIT_SOURCE_SIZE = 2048;

type Stage = 'idle' | 'sheet' | 'preparing' | 'crop' | 'denied';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** uriِ نهایی — JPEGِ برش‌خورده و فشرده، آماده‌ی آپلود. */
  onPicked: (uri: string) => void;
  onError: (message: string) => void;
}

/**
 * جریانِ کاملِ گرفتنِ عکس: انتخابِ سرچشمه → مجوز → پیکر → ویرایشگر → JPEGِ آماده.
 *
 * هر دو نقطه‌ی ورودیِ عکس (تکمیلِ پروفایل و صفحه‌ی پروفایل) از همین کامپوننت
 * استفاده می‌کنند تا رفتار و پیام‌های خطا دقیقاً یکی باشد.
 */
export function PhotoPicker({ visible, onClose, onPicked, onError }: Props) {
  const [stage, setStage] = useState<Stage>('sheet');
  const [source, setSource] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [denied, setDenied] = useState<{ source: PhotoSource; canAskAgain: boolean } | null>(null);

  /**
   * بستن همیشه از این‌جا رد می‌شود تا وضعیتِ داخلی هم‌زمان با visibleِ والد صفر شود؛
   * این‌طور دفعه‌ی بعد جریان از برگه‌ی سرچشمه شروع می‌شود، نه از جایی که رها شده بود.
   */
  const close = useCallback(() => {
    setStage('sheet');
    setSource(null);
    setDenied(null);
    onClose();
  }, [onClose]);

  const pickFrom = useCallback(
    async (from: PhotoSource) => {
      // برگه را پیش از بازشدنِ دیالوگِ سیستمی جمع می‌کنیم تا روی هم نیفتند.
      setStage('idle');
      setDenied(null);
      try {
        const perm =
          from === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setDenied({ source: from, canAskAgain: perm.canAskAgain });
          setStage('denied');
          return;
        }

        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: ['images'],
          // برشِ خودمان را داریم؛ ویرایشگرِ سیستمی روی اندروید ناهم‌گون است.
          allowsEditing: false,
          quality: 1,
          exif: false,
          ...(from === 'camera' ? { cameraType: ImagePicker.CameraType.front } : null),
        };
        const res =
          from === 'camera'
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);
        if (res.canceled || !res.assets?.[0]) {
          close();
          return;
        }

        setStage('preparing');
        // یک تبدیلِ زودهنگام به JPEG: چرخشِ EXIF پخته می‌شود و ابعادی که ویرایشگر
        // می‌بیند دقیقاً همانی است که برش روی آن انجام می‌شود.
        const prepared = await toJpeg(res.assets[0].uri, {
          maxSize: EDIT_SOURCE_SIZE,
          compress: 0.92,
        });
        setSource(prepared);
        setStage('crop');
      } catch (e) {
        onError(photoErrorMessage(e));
        close();
      }
    },
    [close, onError]
  );

  const handleConfirm = useCallback(
    (uri: string) => {
      onPicked(uri);
      close();
    },
    [onPicked, close]
  );

  const handleCropError = useCallback(
    (message: string) => {
      onError(message);
      close();
    },
    [onError, close]
  );

  return (
    <>
      <PhotoSourceSheet
        visible={visible && stage === 'sheet'}
        onSelect={pickFrom}
        onDismiss={close}
      />

      <PhotoCropper
        // قاب‌بندی با هر عکسِ تازه از صفر شروع می‌شود.
        key={source?.uri ?? 'none'}
        visible={visible && stage === 'crop'}
        uri={source?.uri ?? null}
        sourceWidth={source?.width}
        sourceHeight={source?.height}
        // انصراف در ویرایشگر یعنی «عکسِ دیگری می‌خواهم»، نه «بی‌خیالِ عکس».
        onCancel={() => {
          setSource(null);
          setStage('sheet');
        }}
        onConfirm={handleConfirm}
        onError={handleCropError}
      />

      <Modal
        visible={visible && stage === 'preparing'}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.preparing}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.preparingText}>در حالِ آماده‌سازیِ عکس…</Text>
        </View>
      </Modal>

      <PermissionDeniedModal
        denied={visible && stage === 'denied' ? denied : null}
        onRetry={() => denied && pickFrom(denied.source)}
        onClose={close}
      />
    </>
  );
}

/** بن‌بستِ مجوز را باز می‌کند: یا دوباره می‌پرسیم یا مستقیم به تنظیماتِ اپ می‌بریم. */
function PermissionDeniedModal({
  denied,
  onRetry,
  onClose,
}: {
  denied: { source: PhotoSource; canAskAgain: boolean } | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const isCamera = denied?.source === 'camera';
  const title = isCamera ? 'دسترسی به دوربین بسته است' : 'دسترسی به گالری بسته است';
  const body = denied?.canAskAgain
    ? isCamera
      ? 'برای گرفتنِ عکسِ پروفایل باید اجازه‌ی دوربین را بدهی. دوباره تلاش کن و گزینه‌ی «اجازه» را بزن.'
      : 'برای انتخابِ عکس باید اجازه‌ی دسترسی به تصاویر را بدهی. دوباره تلاش کن و گزینه‌ی «اجازه» را بزن.'
    : isCamera
      ? 'مجوزِ دوربین قبلاً رد شده و اپ نمی‌تواند دوباره بپرسد. با یک ضربه به تنظیماتِ اپ برو و «دوربین» را روشن کن.'
      : 'مجوزِ تصاویر قبلاً رد شده و اپ نمی‌تواند دوباره بپرسد. با یک ضربه به تنظیماتِ اپ برو و دسترسی به «عکس‌ها» را روشن کن.';

  return (
    <Modal
      visible={denied != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, shadow.card]}>
          <View style={styles.disc}>
            <Icon name="lock" size={28} tint="gold" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardBody}>{body}</Text>

          <View style={styles.cardActions}>
            <Button
              label={denied?.canAskAgain ? 'تلاشِ دوباره' : 'رفتن به تنظیمات'}
              icon={denied?.canAskAgain ? 'rewind' : 'chevron-next'}
              onPress={() => {
                if (denied?.canAskAgain) {
                  onRetry();
                  return;
                }
                void Linking.openSettings().catch(() => {});
                onClose();
              }}
              style={styles.cardBtn}
            />
            <PressableScale onPress={onClose} hitSlop={8} accessibilityRole="button" scaleTo={0.85} feedback="select">
              <Text style={styles.later}>الان نه</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const DISC = 72;

const styles = StyleSheet.create({
  preparing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(7,5,11,0.82)',
  },
  preparingText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    writingDirection: 'rtl',
  },

  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(7,5,11,0.82)',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardBody: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardActions: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'center', alignSelf: 'stretch' },
  cardBtn: { width: '100%' },
  later: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: spacing.xs,
  },
});
