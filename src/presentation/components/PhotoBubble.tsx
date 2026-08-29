import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { MediaTransferOverlay } from './MediaTransferOverlay';
import { PhotoViewer } from './PhotoViewer';
import type { MediaTransferPhase } from '@/domain/entities';
import { colors, radius } from '@/core/theme';

interface Props {
  matchId: number;
  messageId?: number;
  localUri?: string;
  pending?: boolean;
  failed?: boolean;
  transferPhase?: MediaTransferPhase;
  transferProgress?: number;
  width?: number;
  height?: number;
  mine: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRetry?: () => void;
}

export function PhotoBubble({
  matchId,
  messageId,
  localUri,
  pending,
  failed,
  transferPhase,
  transferProgress,
  width,
  height,
  mine,
  onPress,
  onLongPress,
  onRetry,
}: Props) {
  const [dlProgress, setDlProgress] = useState<number | undefined>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const needsRemote = !!messageId && !localUri;
  const { uri: remoteUri, loading, error } = useChatMediaUri(
    matchId,
    needsRemote ? messageId : undefined,
    'photo',
    'image/webp',
    needsRemote ? setDlProgress : undefined
  );

  const displayUri = localUri || remoteUri;
  const aspect =
    width && height && width > 0 && height > 0
      ? {
          width: Math.min(240, width),
          height: Math.min(320, Math.round((Math.min(240, width) * height) / width)),
        }
      : { width: 220, height: 165 };

  const uploading = !!pending && !failed;
  const downloading = needsRemote && loading && !displayUri;
  const showOverlay =
    failed ||
    uploading ||
    downloading ||
    (transferPhase != null && transferPhase !== 'downloading' && !!pending);

  const overlayPhase: MediaTransferPhase | undefined = failed
    ? undefined
    : uploading
      ? transferPhase ?? 'uploading'
      : downloading
        ? 'downloading'
        : transferPhase;

  const overlayProgress = uploading
    ? transferProgress
    : downloading
      ? dlProgress
      : undefined;

  const handlePress = () => {
    if (failed && onRetry) {
      onRetry();
      return;
    }
    if (onPress) {
      onPress();
      return;
    }
    if (displayUri) setViewerOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={280}
        disabled={!onLongPress && !displayUri && !failed}
        accessibilityRole="image"
        accessibilityLabel="عکس"
        accessibilityHint={onLongPress ? 'نگه‌داشتن برای پاسخ یا حذف' : undefined}
      >
        <View style={[styles.frame, mine ? styles.mine : styles.theirs, aspect]}>
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={[StyleSheet.absoluteFill, styles.img]}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          {showOverlay || (error && !displayUri) ? (
            <MediaTransferOverlay
              phase={error && !displayUri && !failed ? 'downloading' : overlayPhase}
              progress={overlayProgress}
              failed={failed || (!!error && !displayUri && !pending)}
            />
          ) : null}
        </View>
      </Pressable>

      <PhotoViewer
        key={displayUri ?? 'empty'}
        visible={viewerOpen && !!displayUri}
        uri={displayUri ?? null}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mine: { backgroundColor: 'rgba(42,29,18,0.12)' },
  theirs: { backgroundColor: colors.surface2 },
  img: { borderRadius: radius.md },
  placeholder: { ...StyleSheet.absoluteFill, backgroundColor: colors.line },
});
