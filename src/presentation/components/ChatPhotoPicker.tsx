import React, { useCallback, useState } from 'react';
import { View, Text, Modal, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoSourceSheet, type PhotoSource } from './PhotoSourceSheet';
import { Button } from './Button';
import { toJpeg } from '@/core/media/normalizeImage';
import { photoErrorMessage } from '@/core/media/photoErrors';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

type Stage = 'idle' | 'sheet' | 'preparing' | 'denied';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPicked: (uri: string) => void;
  onError: (message: string) => void;
}

/**
 * انتخابِ عکس برای گفتگو — بدونِ برش؛ دوربینِ پشت برای چت.
 */
export function ChatPhotoPicker({ visible, onClose, onPicked, onError }: Props) {
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
          ...(from === 'camera' ? { cameraType: ImagePicker.CameraType.back } : null),
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
        const prepared = await toJpeg(res.assets[0].uri, { maxSize: 1280, compress: 0.85 });
        onPicked(prepared.uri);
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
      <Modal visible={visible && stage === 'preparing'} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.overlayText}>آماده‌سازیِ عکس…</Text>
        </View>
      </Modal>
      <Modal visible={visible && stage === 'denied'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>دسترسی لازم نیست</Text>
            <Text style={styles.deniedBody}>
              {denied?.source === 'camera'
                ? 'برای گرفتنِ عکس در گفتگو به دوربین نیاز داریم.'
                : 'برای انتخابِ عکس از گالری به دسترسیِ تصاویر نیاز داریم.'}
            </Text>
            {denied && !denied.canAskAgain ? (
              <Button label="رفتن به تنظیمات" onPress={() => Linking.openSettings()} />
            ) : null}
            <Button label="بستن" variant="outline" onPress={close} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  overlayText: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  deniedCard: {
    width: '100%',
    maxWidth: 340,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  deniedTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  deniedBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
