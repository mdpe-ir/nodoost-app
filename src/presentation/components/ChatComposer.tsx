import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { PressableScale } from './PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
} from 'expo-audio';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Icon } from './Icon';
import { ChatPhotoPicker } from './ChatPhotoPicker';
import { composerAction } from '@/presentation/chat/composerMode';
import { chatGateOpen, type ChatConfig } from '@/core/config/chatConfig';
import { haptics, hapticThreshold } from '@/core/haptics';
import { faNum } from '@/core/utils/faNum';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  gradients,
  radius,
  spacing,
} from '@/core/theme';

const CANCEL_DRAG = 72;

export interface ChatComposerProps {
  draft: string;
  onChangeDraft: (v: string) => void;
  onSendText: () => void;
  onSendVoice: (uri: string, durationMs: number, peaks: number[]) => void;
  onSendPhoto: (uri: string) => void;
  editing?: boolean;
  sending?: boolean;
  disabled?: boolean;
  chat: ChatConfig;
  myTier: number;
  onPhotoLocked: () => void;
  /** Override tier gate for voice (e.g. support disables voice entirely). */
  voiceEnabled?: boolean;
  /** Allow photo for all tiers when chat.photo is enabled (support threads). */
  photoBypassTier?: boolean;
  showQuotaHint?: React.ReactNode;
}

function formatRecMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${faNum(m)}:${faNum(String(r).padStart(2, '0'))}`;
}

/** نوارِ ورودیِ مشترکِ گفتگو — متن، میکروفون، پیوست. */
export function ChatComposer({
  draft,
  onChangeDraft,
  onSendText,
  onSendVoice,
  onSendPhoto,
  editing,
  sending,
  disabled,
  chat,
  myTier,
  onPhotoLocked,
  voiceEnabled: voiceEnabledProp,
  photoBypassTier,
  showQuotaHint,
}: ChatComposerProps) {
  const voiceEnabled = voiceEnabledProp ?? chatGateOpen(chat.voice, myTier);
  const photoEnabled = photoBypassTier ? chat.photo.enabled : chatGateOpen(chat.photo, myTier);
  const photoLocked = !photoBypassTier && chat.photo.enabled && !photoEnabled;
  const action = composerAction(draft, !!editing);
  const canSend = !!draft.trim() && !sending && !disabled;
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [micDenied, setMicDenied] = useState(false);
  const [showRec, setShowRec] = useState(false);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    numberOfChannels: 1,
    bitRate: 32000,
    sampleRate: 24000,
  });
  const recState = useAudioRecorderState(recorder, 120);
  const recording = recState.isRecording;
  const dragX = useSharedValue(0);
  const peaksRef = useRef<number[]>([]);
  const startedAt = useRef(0);
  const autoSent = useRef(false);

  useEffect(() => {
    setShowRec(recording);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      peaksRef.current = [...peaksRef.current.slice(-40), 0.2 + Math.random() * 0.75].slice(-48);
    }, 120);
    return () => clearInterval(t);
  }, [recording]);

  const finishRecording = useCallback(
    async (cancelled: boolean) => {
      setShowRec(false);
      try {
        await recorder.stop();
      } catch {
        /* noop */
      }
      const uri = recorder.uri;
      const durationMs = Math.round(recState.durationMillis || Date.now() - startedAt.current);
      dragX.value = 0;
      if (cancelled || durationMs < chat.voiceMinMs) {
        haptics.warn();
        return;
      }
      if (uri) {
        haptics.success();
        onSendVoice(uri, durationMs, peaksRef.current);
      }
    },
    [recorder, recState.durationMillis, dragX, chat.voiceMinMs, onSendVoice]
  );

  useEffect(() => {
    if (!recording) return;
    const elapsed = recState.durationMillis || Date.now() - startedAt.current;
    if (elapsed >= chat.voiceMaxMs && !autoSent.current) {
      autoSent.current = true;
      void finishRecording(false);
    }
  }, [recState.durationMillis, recording, chat.voiceMaxMs, finishRecording]);

  const startRecording = useCallback(async () => {
    if (!voiceEnabled || disabled || editing) return;
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setMicDenied(true);
      return;
    }
    peaksRef.current = [];
    startedAt.current = Date.now();
    autoSent.current = false;
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      hapticThreshold();
    } catch {
      setMicDenied(true);
    }
  }, [voiceEnabled, disabled, editing, recorder]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(recording)
        .onUpdate((e) => {
          dragX.value = Math.min(0, e.translationX);
        })
        .onEnd(() => {
          const cancel = dragX.value <= -CANCEL_DRAG;
          runOnJS(finishRecording)(cancel);
        }),
    [recording, dragX, finishRecording]
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: showRec ? 1 : 0,
  }));

  const onAttach = () => {
    if (photoLocked) {
      onPhotoLocked();
      return;
    }
    if (photoEnabled) setPhotoOpen(true);
  };

  return (
    <>
      <View style={styles.composer}>
        {showQuotaHint}
        {!editing && (photoEnabled || photoLocked) ? (
          <PressableScale
            scaleTo={0.9}
            feedback="select"
            style={styles.iconBtn}
            onPress={onAttach}
            disabled={disabled || sending}
            accessibilityRole="button"
            accessibilityLabel="پیوستِ عکس"
          >
            <Icon name="plus" size={20} tint={photoLocked ? 'ink' : 'gold'} />
          </PressableScale>
        ) : null}
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={editing ? 'متنِ تازه…' : 'پیامت را بنویس…'}
          placeholderTextColor={colors.ink3}
          textAlign="right"
          multiline
          editable={!disabled && !recording}
        />
        {action === 'send' ? (
          <PressableScale
            scaleTo={0.9}
            feedback="select"
            style={styles.send}
            onPress={onSendText}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'ذخیره' : 'ارسال'}
          >
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, !canSend && styles.sendOff]}
            />
            <Icon name={editing ? 'check' : 'send-fill'} size={20} tint="ink" />
          </PressableScale>
        ) : voiceEnabled ? (
          <GestureDetector gesture={pan}>
            <Pressable
              onPressIn={() => void startRecording()}
              disabled={disabled || sending}
              style={[styles.send, styles.micBtn]}
              accessibilityRole="button"
              accessibilityLabel="نگه‌دار برای ضبط"
            >
              <Icon name="send-fill" size={20} tint="gold" />
            </Pressable>
          </GestureDetector>
        ) : null}
      </View>

      <Modal visible={showRec} transparent animationType="fade">
        <Animated.View style={[styles.recOverlay, overlayStyle]}>
          <Text style={styles.recHint}>برای لغو به سمتِ متن بکش</Text>
          <Text style={styles.recTime}>{formatRecMs(recState.durationMillis)}</Text>
          <View style={styles.recWave}>
            {(peaksRef.current.length ? peaksRef.current : Array.from({ length: 24 }, () => 0.3)).map(
              (h, i) => (
                <View key={i} style={[styles.recBar, { height: 8 + h * 28 }]} />
              )
            )}
          </View>
        </Animated.View>
      </Modal>

      <ChatPhotoPicker
        visible={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onPicked={onSendPhoto}
        onError={(m) => setPhotoError(m)}
      />
      {photoError ? (
        <Pressable onPress={() => setPhotoError(undefined)}>
          <Text style={styles.err}>{photoError}</Text>
        </Pressable>
      ) : null}

      <Modal visible={micDenied} transparent animationType="fade">
        <View style={styles.deniedWrap}>
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>دسترسی به میکروفون</Text>
            <Text style={styles.deniedBody}>
              برای ضبطِ پیام صوتی باید به میکروفون اجازه بدهی.
            </Text>
            <Pressable style={styles.deniedBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.deniedBtnText}>رفتن به تنظیمات</Text>
            </Pressable>
            <Pressable onPress={() => setMicDenied(false)}>
              <Text style={styles.deniedCancel}>بستن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    writingDirection: 'rtl',
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  sendOff: { opacity: 0.35 },
  iconBtn: {
    width: 40,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,9,16,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  recHint: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.ink2,
    marginBottom: spacing.md,
  },
  recTime: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  recWave: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    height: 40,
  },
  recBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  err: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'right',
  },
  deniedWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  deniedCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  deniedTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    textAlign: 'right',
  },
  deniedBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
  },
  deniedBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deniedBtnText: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  deniedCancel: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    color: colors.ink3,
    paddingVertical: spacing.sm,
  },
});
