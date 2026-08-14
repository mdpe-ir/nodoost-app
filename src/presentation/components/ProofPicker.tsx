import React, { useCallback, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { Icon } from './Icon';
import { PhotoSourceSheet, type PhotoSource } from './PhotoSourceSheet';
import { normalizeImage } from '@/core/media/normalizeImage';
import { photoErrorMessage } from '@/core/media/photoErrors';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** uriِ نهایی — JPEGِ فشرده، آماده‌ی آپلود. */
  onPicked: (uri: string) => void;
  onError: (message: string) => void;
}

type Stage = 'sheet' | 'idle' | 'preparing' | 'denied';

/**
 * انتخابِ عکسِ مدرک: سرچشمه → مجوز → پیکر → JPEGِ فشرده.
 *
 * عمداً PhotoPicker نیست: آن یکی برشِ مربعیِ اجباری دارد که برای عکسِ پروفایل
 * درست است ولی رسیدِ خرید یا اسکرین‌شات را قیچی می‌کند. این‌جا فقط اندازه و
 * فرمت نرمال می‌شود و قابِ عکس دست‌نخورده می‌ماند.
 */
export function ProofPicker({ visible, onClose, onPicked, onError }: Props) {
  const [stage, setStage] = useState<Stage>('sheet');
  const [denied, setDenied] = useState<{ source: PhotoSource; canAskAgain: boolean } | null>(null);

  const close = useCallback(() => {
    setStage('sheet');
    setDenied(null);
    onClose();
  }, [onClose]);

  const pickFrom = useCallback(
    async (from: PhotoSource) => {
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
          allowsEditing: false,
          quality: 1,
          exif: false,
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
        // فشرده‌سازیِ محلی پیش از آپلود: عکسِ خامِ دوربین چند مگابایت است و
        // سقفِ سرور را رد می‌کند — کاربر فقط «ارسال نشد» می‌دید بی‌آنکه بداند چرا.
        const uri = await normalizeImage(res.assets[0].uri);
        onPicked(uri);
        close();
      } catch (e) {
        onError(photoErrorMessage(e));
        close();
      }
    },
    [close, onError, onPicked]
  );

  return (
    <>
      <PhotoSourceSheet
        visible={visible && stage === 'sheet'}
        onSelect={pickFrom}
        onDismiss={close}
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

      <Modal
        visible={visible && stage === 'denied'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={[styles.card, shadow.card]}>
            <View style={styles.disc}>
              <Icon name="lock" size={28} tint="gold" />
            </View>
            <Text style={styles.cardTitle}>
              {denied?.source === 'camera' ? 'دسترسی به دوربین بسته است' : 'دسترسی به گالری بسته است'}
            </Text>
            <Text style={styles.cardBody}>
              {denied?.canAskAgain
                ? 'برای فرستادنِ مدرک باید اجازه بدهی. دوباره تلاش کن و «اجازه» را بزن.'
                : 'مجوز قبلاً رد شده و اپ نمی‌تواند دوباره بپرسد. به تنظیماتِ اپ برو و دسترسی را روشن کن.'}
            </Text>
            <View style={styles.cardActions}>
              <Button
                label={denied?.canAskAgain ? 'تلاشِ دوباره' : 'رفتن به تنظیمات'}
                icon={denied?.canAskAgain ? 'rewind' : 'chevron-next'}
                onPress={() => {
                  if (denied?.canAskAgain) {
                    void pickFrom(denied.source);
                    return;
                  }
                  void Linking.openSettings().catch(() => {});
                  close();
                }}
                style={styles.cardBtn}
              />
              <Pressable onPress={close} hitSlop={8} accessibilityRole="button">
                <Text style={styles.later}>الان نه</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
