/*
 * قاعده‌ی `immutability` و `refs` کامپایلرِ React مدلی از SharedValue و
 * کال‌بکِ ژست ندارد: مقدارِ مشترک بیرونِ رندر زندگی می‌کند و هندلرِ RNGH
 * موقعِ لمس اجرا می‌شود، نه موقعِ رندر. مستندِ Reanimated همین را می‌گوید.
 */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/refs */
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
  I18nManager,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  EmojiKeyboard,
  createMemoryAdapter,
  useEmojiKeyboardSwap,
  type EmojiKeyboardProps,
  type EmojiType,
} from '@softwhere-uz/react-native-emoji-keyboard';
import { PressableScale } from './PressableScale';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
  gradients,
  lineHeights,
  radius,
  spacing,
} from '@/core/theme';

/** فاصله‌ی کشیدن به چپ برای لغو — مثل تلگرام. */
const CANCEL_DRAG = 80;
/** تا این مدت نگه‌داری نشود، ضبط شروع نمی‌شود. */
const HOLD_MS = 200;
/**
 * نرخِ ۴۴۱۰۰ تنها نرخی است که اندروید روی همهٔ دستگاه‌ها تضمین می‌کند.
 * ۲۴۰۰۰ روی بعضی سخت‌افزار واقعی MediaRecorder را کرش می‌دهد.
 */
const VOICE_RECORDING = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
};

/** بدون `allowsRecording`، prepare/record روی دستگاه واقعی کرش می‌کند. */
async function setMicAudioMode(recording: boolean) {
  try {
    await setAudioModeAsync({
      allowsRecording: recording,
      playsInSilentMode: true,
    });
  } catch {
    /* بعضی OEMها جلسه را رد می‌کنند؛ caller هنوز prepare را امتحان می‌کند. */
  }
}

/**
 * کرومِ تلگرام همیشه چپ‌به‌راست است. در اپِ RTL، `flexDirection:'row'`
 * فرزندان را از راست می‌چیند — پس باید معکوسش کنیم.
 */
const ROW_LTR = I18nManager.isRTL ? 'row-reverse' : 'row';

/** تلگرام: یک خط → حداکثر ۴ خط → بعد اسکرول. */
const INPUT_FONT = 16;
const INPUT_LINE_H = 22;
const INPUT_MIN_H = 40;
const INPUT_MAX_LINES = 4;
const INPUT_MAX_H = INPUT_LINE_H * INPUT_MAX_LINES;
const SHELL_INSET = 4;
const SHELL_MIN_H = INPUT_MIN_H + SHELL_INSET * 2;
const SHELL_MAX_H = INPUT_MAX_H + SHELL_INSET * 2;
const HEIGHT_ANIM_MS = 160;
const ATTACH_SLOT = 40;
/** ارتفاع پیش‌فرض پنل ایموجی تا وقتی ارتفاع کیبورد واقعی اندازه‌گیری شود (و روی وب). */
const EMOJI_FALLBACK_H = 300;
/** مدتِ انیمیشن جابه‌جایی کیبورد ↔ ایموجی — هم‌زمان با انیمیشن سیستمی کیبورد. */
const EMOJI_SWAP_MS = 280;
/** وب: TextStyle تایپِ `outlineStyle: 'none'` را ندارد. */
const WEB_INPUT_RESET = { outlineStyle: 'none' };

const emojiStorage = createMemoryAdapter();

/** لیبل‌های فارسی — پکیج localeِ `fa` ندارد. */
const EMOJI_FA: NonNullable<EmojiKeyboardProps['translation']> = {
  favorites: 'علاقه‌مندی‌ها',
  recently_used: 'اخیراً استفاده‌شده',
  smileys_emotion: 'شکلک و احساس',
  people_body: 'افراد',
  animals_nature: 'حیوانات و طبیعت',
  food_drink: 'غذا و نوشیدنی',
  travel_places: 'سفر و مکان‌ها',
  activities: 'فعالیت‌ها',
  objects: 'اشیا',
  symbols: 'نمادها',
  flags: 'پرچم‌ها',
  search: 'جستجوی ایموجی',
};

const emojiTheme = {
  backdrop: 'rgba(7,5,11,0.65)',
  knob: colors.ink3,
  container: colors.bg,
  header: colors.ink2,
  skinTonesContainer: colors.surface2,
  category: {
    icon: colors.ink3,
    iconActive: colors.gold,
    container: colors.surface,
    containerActive: colors.goldFaint,
  },
  search: {
    background: colors.surface2,
    text: colors.ink,
    placeholder: colors.ink3,
    icon: colors.ink3,
  },
  customButton: {
    icon: colors.ink2,
    iconPressed: colors.gold,
    background: colors.surface2,
    backgroundPressed: colors.goldFaint,
  },
  emoji: { selected: colors.goldSoft },
} as const;

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
  voiceEnabled?: boolean;
  photoBypassTier?: boolean;
  showQuotaHint?: React.ReactNode;
  /** وقتی پنل ایموجی باز است — برای جمع کردن فهرست/اسکرول در صفحهٔ میزبان. */
  onBottomInsetChange?: (height: number) => void;
}

function formatRecMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${faNum(m)}:${faNum(String(r).padStart(2, '0'))}`;
}

/** نقطهٔ قرمزِ تپنده — نشانِ «در حال ضبط». */
function RecPulseDot() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles.recDot, style]} />;
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
  onBottomInsetChange,
}: ChatComposerProps) {
  const voiceEnabled = voiceEnabledProp ?? chatGateOpen(chat.voice, myTier);
  const photoEnabled = photoBypassTier ? chat.photo.enabled : chatGateOpen(chat.photo, myTier);
  const photoLocked = !photoBypassTier && chat.photo.enabled && !photoEnabled;
  const action = composerAction(draft, !!editing);
  const canSend = !!draft.trim() && !sending && !disabled;
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [micDenied, setMicDenied] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const emojiSwap = useEmojiKeyboardSwap({
    inputRef,
    fallbackHeight: EMOJI_FALLBACK_H,
  });
  const emojiPanelH = emojiSwap.keyboardHeight || EMOJI_FALLBACK_H;
  const [emojiPanelMounted, setEmojiPanelMounted] = useState(false);
  if (emojiSwap.emojiOpen && !emojiPanelMounted) {
    setEmojiPanelMounted(true);
  }
  const emojiProgress = useSharedValue(0);
  const emojiIconMode = useSharedValue(0);

  useEffect(() => {
    emojiProgress.value = withTiming(emojiSwap.emojiOpen ? 1 : 0, {
      duration: EMOJI_SWAP_MS,
      easing: Easing.out(Easing.cubic),
    });
    emojiIconMode.value = withTiming(emojiSwap.emojiOpen ? 1 : 0, {
      duration: EMOJI_SWAP_MS * 0.75,
      easing: Easing.out(Easing.cubic),
    });
  }, [emojiSwap.emojiOpen, emojiProgress, emojiIconMode]);

  useEffect(() => {
    onBottomInsetChange?.(emojiSwap.inset);
  }, [emojiSwap.inset, onBottomInsetChange]);
  const [armed, setArmed] = useState(false);
  const [willCancel, setWillCancel] = useState(false);
  const [peaks, setPeaks] = useState<number[]>(() => Array.from({ length: 16 }, () => 0.28));

  const recorder = useAudioRecorder(VOICE_RECORDING);
  const recState = useAudioRecorderState(recorder, 120);
  const recording = recState.isRecording;
  const dragX = useSharedValue(0);
  const cancelProgress = useSharedValue(0);
  const micScale = useSharedValue(1);
  const ring = useSharedValue(0);
  /** ۰ = میکروفون، ۱ = ارسال — برای کراس‌فید نرم. */
  const actionMode = useSharedValue(action === 'send' ? 1 : 0);
  const peaksRef = useRef<number[]>([]);
  const startedAt = useRef(0);
  const autoSent = useRef(false);
  const finishing = useRef(false);
  const cancelArmed = useSharedValue(0);
  /** جلوگیری از دوبارِ صدا زدنِ پایانِ ژست (onEnd + onFinalize + onTouchesUp). */
  const releaseHandled = useRef(false);
  /** انگشت/ماوس هنوز پایین است — حتی اگر RNGH ژست را لغو کند. */
  const holdActiveRef = useRef(false);
  const holdActive = useSharedValue(0);
  type RecPhase = 'idle' | 'arming' | 'recording' | 'stopping';
  const phaseRef = useRef<RecPhase>('idle');
  const pendingReleaseRef = useRef<boolean | null>(null);
  const micGrantedRef = useRef(false);
  const permAskRef = useRef<Promise<boolean> | null>(null);

  const showAttach = !editing && (photoEnabled || photoLocked);
  const showRecUi = armed || recording;
  const hasDraft = draft.length > 0;
  const [inputScroll, setInputScroll] = useState(false);
  const [multiLine, setMultiLine] = useState(false);
  const inputHeight = useSharedValue(INPUT_MIN_H);
  const attachSlot = useSharedValue(showAttach ? 1 : 0);

  const isSend = action === 'send';

  if (!draft) {
    if (inputScroll) setInputScroll(false);
    if (multiLine) setMultiLine(false);
  }

  if (!armed && !recording && willCancel) {
    setWillCancel(false);
  }

  useEffect(() => {
    if (!draft) {
      inputHeight.value = withTiming(INPUT_MIN_H, {
        duration: HEIGHT_ANIM_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [draft, inputHeight]);

  useEffect(() => {
    const visible = showAttach && !hasDraft && !showRecUi;
    attachSlot.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [showAttach, hasDraft, showRecUi, attachSlot]);

  const onInputContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const raw = Math.ceil(e.nativeEvent.contentSize.height);
      const next = Math.min(Math.max(raw, INPUT_MIN_H), INPUT_MAX_H);
      inputHeight.value = withTiming(next, {
        duration: HEIGHT_ANIM_MS,
        easing: Easing.out(Easing.cubic),
      });
      setMultiLine(next > INPUT_MIN_H + 1);
      setInputScroll(raw > INPUT_MAX_H);
    },
    [inputHeight]
  );

  const composerShellStyle = useAnimatedStyle(() => ({
    minHeight: Math.max(SHELL_MIN_H, inputHeight.value + SHELL_INSET * 2),
    maxHeight: SHELL_MAX_H,
  }));

  const inputWrapStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
  }));

  /** فقط جمع‌شدنِ فضا — scale/opacity روی آیکونِ داخلی تا هنگامِ hide بزرگ نشود. */
  const attachSlotLayoutStyle = useAnimatedStyle(() => ({
    width: interpolate(attachSlot.value, [0, 1], [0, ATTACH_SLOT]),
  }));

  const attachIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(attachSlot.value, [0, 0.35, 1], [0, 0, 1]),
    transform: [{ scale: interpolate(attachSlot.value, [0, 1], [0.68, 1]) }],
  }));

  const emojiPanelAnimStyle = useAnimatedStyle(() => ({
    height: emojiProgress.value * emojiPanelH,
    opacity: interpolate(emojiProgress.value, [0, 0.12, 1], [0, 0.92, 1]),
    transform: [
      {
        translateY: interpolate(
          emojiProgress.value,
          [0, 1],
          [Math.min(emojiPanelH * 0.06, 18), 0]
        ),
      },
    ],
  }));

  const emojiIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(emojiIconMode.value, [0, 0.5, 1], [1, 0.15, 0]),
    transform: [
      { scale: interpolate(emojiIconMode.value, [0, 1], [1, 0.82]) },
      { rotate: `${interpolate(emojiIconMode.value, [0, 1], [0, -14])}deg` },
    ],
  }));

  const keypadIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(emojiIconMode.value, [0, 0.5, 1], [0, 0.15, 1]),
    transform: [
      { scale: interpolate(emojiIconMode.value, [0, 1], [0.82, 1]) },
      { rotate: `${interpolate(emojiIconMode.value, [0, 1], [14, 0])}deg` },
    ],
  }));

  useEffect(() => {
    actionMode.value = withTiming(isSend ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSend, actionMode]);

  useEffect(() => {
    if (!armed && !recording) return;
    const t = setInterval(() => {
      const next = [...peaksRef.current.slice(-24), 0.18 + Math.random() * 0.82].slice(-28);
      peaksRef.current = next;
      setPeaks(next.slice(-16));
    }, 90);
    return () => clearInterval(t);
  }, [armed, recording]);

  useEffect(() => {
    if (armed || recording) {
      emojiSwap.close();
      micScale.value = withTiming(1.22, { duration: 160 });
      ring.value = withTiming(1, { duration: 180 });
    } else {
      micScale.value = withTiming(1, { duration: 140 });
      ring.value = withTiming(0, { duration: 140 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only on arm/record edge
  }, [armed, recording, micScale, ring]);

  useAnimatedReaction(
    () => cancelProgress.value >= 0.92,
    (crossed, prev) => {
      if (crossed && !prev) {
        cancelArmed.value = 1;
        runOnJS(hapticThreshold)();
        runOnJS(setWillCancel)(true);
      } else if (!crossed && prev) {
        cancelArmed.value = 0;
        runOnJS(setWillCancel)(false);
      }
    }
  );

  const resetSession = useCallback(() => {
    phaseRef.current = 'idle';
    pendingReleaseRef.current = null;
    holdActiveRef.current = false;
    holdActive.value = 0;
    setArmed(false);
    setWillCancel(false);
    finishing.current = false;
  }, [holdActive]);

  const finishRecording = useCallback(
    async (cancelled: boolean) => {
      if (phaseRef.current === 'idle') return;

      if (phaseRef.current === 'arming') {
        pendingReleaseRef.current = cancelled;
        return;
      }

      if (phaseRef.current === 'stopping' || finishing.current) return;

      finishing.current = true;
      const shouldStop = phaseRef.current === 'recording';
      phaseRef.current = 'stopping';
      holdActiveRef.current = false;
      holdActive.value = 0;
      setArmed(false);
      setWillCancel(false);
      dragX.value = withTiming(0, { duration: 120 });
      cancelProgress.value = withTiming(0, { duration: 120 });

      try {
        if (shouldStop) await recorder.stop();
      } catch {
        /* noop */
      }
      await setMicAudioMode(false);

      const uri = recorder.uri;
      const durationMs = Math.max(
        0,
        Math.round(recState.durationMillis || Date.now() - startedAt.current)
      );

      phaseRef.current = 'idle';
      pendingReleaseRef.current = null;
      finishing.current = false;

      if (cancelled || durationMs < chat.voiceMinMs) {
        haptics.warn();
        return;
      }
      if (uri) {
        haptics.success();
        onSendVoice(uri, durationMs, peaksRef.current);
      }
    },
    [
      recorder,
      recState.durationMillis,
      dragX,
      cancelProgress,
      chat.voiceMinMs,
      onSendVoice,
      holdActive,
    ]
  );

  useEffect(() => {
    if (!recording) return;
    const elapsed = recState.durationMillis || Date.now() - startedAt.current;
    if (elapsed >= chat.voiceMaxMs && !autoSent.current) {
      autoSent.current = true;
      void finishRecording(false);
    }
  }, [recState.durationMillis, recording, chat.voiceMaxMs, finishRecording]);

  const ensureMicPermission = useCallback(async (): Promise<boolean> => {
    if (micGrantedRef.current) return true;
    if (permAskRef.current) return permAskRef.current;

    permAskRef.current = (async () => {
      try {
        const asked = await AudioModule.requestRecordingPermissionsAsync();
        micGrantedRef.current = !!asked.granted;
        if (!asked.granted) setMicDenied(true);
        return !!asked.granted;
      } catch {
        setMicDenied(true);
        return false;
      } finally {
        permAskRef.current = null;
      }
    })();

    return permAskRef.current;
  }, []);

  const startRecording = useCallback(async () => {
    if (!voiceEnabled || disabled || editing || phaseRef.current !== 'idle') return;

    const granted = await ensureMicPermission();
    if (!granted) {
      resetSession();
      return;
    }

    // دیالوگِ سیستم ژست را قطع می‌کند؛ اگر انگشت دیگر پایین نیست، این بار ضبط نکن.
    if (!holdActiveRef.current || phaseRef.current !== 'idle') {
      resetSession();
      return;
    }

    phaseRef.current = 'arming';

    if (pendingReleaseRef.current !== null) {
      pendingReleaseRef.current = null;
      resetSession();
      return;
    }

    peaksRef.current = [];
    setPeaks(Array.from({ length: 16 }, () => 0.28));
    startedAt.current = Date.now();
    autoSent.current = false;

    try {
      await setMicAudioMode(true);

      if (pendingReleaseRef.current !== null) {
        pendingReleaseRef.current = null;
        await setMicAudioMode(false);
        resetSession();
        return;
      }

      if (recorder.isRecording) {
        try {
          await recorder.stop();
        } catch {
          /* leftover session */
        }
      }

      await recorder.prepareToRecordAsync(VOICE_RECORDING);

      if (pendingReleaseRef.current !== null) {
        pendingReleaseRef.current = null;
        try {
          await recorder.stop();
        } catch {
          /* prepared but never started */
        }
        await setMicAudioMode(false);
        resetSession();
        return;
      }

      recorder.record();
      phaseRef.current = 'recording';
      setArmed(true);

      if (pendingReleaseRef.current !== null) {
        const cancel = pendingReleaseRef.current;
        pendingReleaseRef.current = null;
        await finishRecording(cancel);
      }
    } catch {
      await setMicAudioMode(false);
      resetSession();
      setMicDenied(true);
    }
  }, [voiceEnabled, disabled, editing, recorder, resetSession, finishRecording, ensureMicPermission]);

  const onHoldActivate = useCallback(() => {
    releaseHandled.current = false;
    void startRecording();
  }, [startRecording]);

  const markHoldActive = useCallback(() => {
    holdActiveRef.current = true;
  }, []);

  const releaseHold = useCallback(
    (cancelled: boolean) => {
      if (!holdActiveRef.current && phaseRef.current === 'idle') return;
      holdActiveRef.current = false;
      holdActive.value = 0;
      if (releaseHandled.current) return;
      releaseHandled.current = true;
      void finishRecording(cancelled).finally(() => {
        releaseHandled.current = false;
      });
    },
    [finishRecording, holdActive]
  );

  const onHoldEnd = useCallback(
    (cancelled: boolean) => {
      releaseHold(cancelled);
    },
    [releaseHold]
  );

  const holdPan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(HOLD_MS)
        .enabled(!disabled && !sending && voiceEnabled && !editing && !isSend)
        .onTouchesDown(() => {
          runOnJS(ensureMicPermission)();
        })
        .onStart(() => {
          holdActive.value = 1;
          runOnJS(markHoldActive)();
          dragX.value = 0;
          cancelProgress.value = 0;
          runOnJS(onHoldActivate)();
        })
        .onUpdate((e) => {
          const x = Math.min(0, e.translationX);
          dragX.value = x;
          cancelProgress.value = interpolate(
            -x,
            [0, CANCEL_DRAG],
            [0, 1],
            Extrapolation.CLAMP
          );
        })
        .onTouchesUp(() => {
          'worklet';
          if (holdActive.value === 0) return;
          const cancel = dragX.value <= -CANCEL_DRAG || cancelProgress.value >= 0.92;
          holdActive.value = 0;
          runOnJS(onHoldEnd)(cancel);
        })
        .onEnd(() => {
          'worklet';
          if (holdActive.value === 0) return;
          const cancel = dragX.value <= -CANCEL_DRAG || cancelProgress.value >= 0.92;
          holdActive.value = 0;
          runOnJS(onHoldEnd)(cancel);
        })
        .onFinalize((_e, success) => {
          'worklet';
          if (success || holdActive.value === 0) return;
          const cancel = dragX.value <= -CANCEL_DRAG || cancelProgress.value >= 0.92;
          holdActive.value = 0;
          runOnJS(onHoldEnd)(cancel);
        }),
    [
      disabled,
      sending,
      voiceEnabled,
      editing,
      isSend,
      dragX,
      cancelProgress,
      holdActive,
      onHoldActivate,
      markHoldActive,
      ensureMicPermission,
      onHoldEnd,
    ]
  );

  // روی وب/وقتی UI عوض می‌شود RNGH ممکن است onEnd را از دست بدهد — pointerup پشتیبان.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!armed && !recording && !holdActiveRef.current) return;

    const onPointerRelease = () => {
      if (!holdActiveRef.current && phaseRef.current === 'idle') return;
      onHoldEnd(willCancel);
    };

    window.addEventListener('pointerup', onPointerRelease, true);
    window.addEventListener('pointercancel', onPointerRelease, true);
    return () => {
      window.removeEventListener('pointerup', onPointerRelease, true);
      window.removeEventListener('pointercancel', onPointerRelease, true);
    };
  }, [armed, recording, willCancel, onHoldEnd]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value * 0.55 }],
  }));

  const slideHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cancelProgress.value, [0, 0.55, 0.92], [0.7, 0.9, 0]),
  }));

  const releaseHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cancelProgress.value, [0.75, 0.92], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(cancelProgress.value, [0.75, 1], [0.86, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cancelProgress.value,
      [0, 1],
      [colors.surface, 'rgba(255,92,122,0.16)']
    ),
    borderColor: interpolateColor(
      cancelProgress.value,
      [0, 1],
      [colors.line, colors.roseSoft]
    ),
  }));

  const micWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const micRingStyle = useAnimatedStyle(() => ({
    opacity: ring.value * interpolate(cancelProgress.value, [0, 1], [0.45, 0.75]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.85, 1.55]) }],
    backgroundColor: interpolateColor(
      cancelProgress.value,
      [0, 1],
      ['rgba(218,184,119,0.35)', 'rgba(255,92,122,0.4)']
    ),
  }));

  const micIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(actionMode.value, [0, 0.55, 1], [1, 0.15, 0]),
    transform: [
      { scale: interpolate(actionMode.value, [0, 1], [1, 0.45]) },
      { rotate: `${interpolate(actionMode.value, [0, 1], [0, -28])}deg` },
    ],
  }));

  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(actionMode.value, [0, 0.45, 1], [0, 0.2, 1]),
    transform: [
      { scale: interpolate(actionMode.value, [0, 1], [0.45, 1]) },
      { rotate: `${interpolate(actionMode.value, [0, 1], [28, 0])}deg` },
    ],
  }));

  const onAttach = () => {
    if (photoLocked) {
      onPhotoLocked();
      return;
    }
    if (photoEnabled) setPhotoOpen(true);
  };

  const onPickEmoji = useCallback(
    (emoji: EmojiType) => {
      onChangeDraft(draft + emoji.emoji);
    },
    [draft, onChangeDraft]
  );

  /** روی وب رویداد keyboardDidShow نمی‌آید؛ showKeyboard پنل را باز می‌گذارد. */
  const onToggleEmojiKeyboard = useCallback(() => {
    if (emojiSwap.emojiOpen) {
      if (Platform.OS === 'web') {
        emojiSwap.close();
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        emojiSwap.showKeyboard();
      }
    } else {
      emojiSwap.showEmoji();
    }
  }, [emojiSwap]);

  const onInputFocus = useCallback(() => {
    if (Platform.OS === 'web' && emojiSwap.emojiOpen) {
      emojiSwap.close();
      return;
    }
    emojiSwap.onInputFocus();
  }, [emojiSwap]);

  const showAction = isSend || voiceEnabled;
  const attachInteractive = showAttach && !hasDraft && !showRecUi;

  const actionOrb = showAction ? (
    <GestureDetector gesture={holdPan}>
      <Animated.View
        style={[styles.micHit, micWrapStyle]}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={
          isSend
            ? editing
              ? 'ذخیره'
              : 'ارسال'
            : 'نگه‌دار برای ضبط؛ برای لغو به چپ بکش'
        }
      >
        <Animated.View style={[styles.micRing, micRingStyle]} pointerEvents="none" />
        {isSend ? (
          <Pressable
            onPress={onSendText}
            disabled={!canSend}
            style={[styles.action, !canSend && styles.actionOff]}
          >
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.iconStack} pointerEvents="none">
              <Animated.View style={[styles.iconLayer, sendIconStyle]}>
                <Icon name={editing ? 'check' : 'send-fill'} size={22} tint="onGold" />
              </Animated.View>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.action, willCancel && styles.actionCancel]}>
            {willCancel ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.rose }]} />
            ) : (
              <LinearGradient
                colors={gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.iconStack} pointerEvents="none">
              <Animated.View style={[styles.iconLayer, micIconStyle]}>
                <Icon name={willCancel ? 'trash' : 'mic'} size={22} tint={willCancel ? 'white' : 'onGold'} />
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  ) : null;

  return (
    <>
      <View style={styles.wrap}>
        {showQuotaHint}
        <View style={styles.composer}>
          <Animated.View
            style={[
              styles.inputShell,
              !showRecUi && composerShellStyle,
              multiLine && !showRecUi && styles.inputShellMulti,
              showRecUi && styles.recShell,
              showRecUi ? shellStyle : undefined,
            ]}
          >
            {showRecUi ? (
              <View style={styles.recBody}>
                <View style={styles.recLeft}>
                  <RecPulseDot />
                  <Text style={styles.recTime}>{formatRecMs(recState.durationMillis)}</Text>
                </View>

                <View style={styles.recWave}>
                  {peaks.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.recBarTick,
                        {
                          height: 5 + h * 18,
                          opacity: 0.45 + h * 0.55,
                          backgroundColor: willCancel ? colors.rose : colors.gold,
                        },
                      ]}
                    />
                  ))}
                </View>

                <Animated.View style={[styles.recHintStage, slideStyle]} pointerEvents="none">
                  <Animated.View style={[styles.recHintRow, slideHintStyle]}>
                    <Icon name="chevron-prev" size={14} tint="gold" />
                    <Text style={styles.recHint}>برای لغو به چپ بکش</Text>
                  </Animated.View>
                  <Animated.View style={[styles.recHintRow, styles.recHintRelease, releaseHintStyle]}>
                    <Icon name="trash" size={15} tint="white" />
                    <Text style={styles.recHintCancel}>رها کن تا لغو شود</Text>
                  </Animated.View>
                </Animated.View>
              </View>
            ) : (
              <>
                <PressableScale
                  scaleTo={0.88}
                  hitSlop={6}
                  style={styles.sideBtn}
                  onPress={onToggleEmojiKeyboard}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={emojiSwap.emojiOpen ? 'کیبورد' : 'ایموجی'}
                >
                  <View style={styles.emojiIconStack}>
                    {/* happy در جریان عادی؛ absolute روی Ionicons در اندروید وسط‌چین را خراب می‌کند. */}
                    <Animated.View style={emojiIconStyle}>
                      <Icon name="happy" size={24} tint="ink2" />
                    </Animated.View>
                    <Animated.View style={[styles.emojiIconLayer, keypadIconStyle]}>
                      <Icon name="keypad" size={24} tint="ink2" />
                    </Animated.View>
                  </View>
                </PressableScale>
                <Animated.View style={[styles.inputWrap, inputWrapStyle]}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      Platform.OS === 'web' ? (WEB_INPUT_RESET as TextStyle) : null,
                    ]}
                    value={draft}
                    onChangeText={onChangeDraft}
                    onContentSizeChange={onInputContentSizeChange}
                    onFocus={onInputFocus}
                    placeholder={editing ? 'متنِ تازه…' : 'پیام'}
                    placeholderTextColor={colors.ink3}
                    textAlign="right"
                    multiline
                    scrollEnabled={inputScroll}
                    editable={!disabled}
                    textAlignVertical={multiLine ? 'top' : 'center'}
                  />
                </Animated.View>
                {showAttach ? (
                  <Animated.View
                    style={[styles.attachSlot, attachSlotLayoutStyle]}
                    pointerEvents={attachInteractive ? 'auto' : 'none'}
                  >
                    <Animated.View style={attachIconStyle}>
                      <PressableScale
                        scaleTo={0.88}
                        hitSlop={6}
                        style={styles.sideBtn}
                        onPress={onAttach}
                        disabled={disabled || sending}
                        accessibilityRole="button"
                        accessibilityLabel="پیوستِ عکس"
                      >
                        <Icon name="paperclip" size={22} tint="ink2" />
                      </PressableScale>
                    </Animated.View>
                  </Animated.View>
                ) : null}
              </>
            )}
            {actionOrb}
          </Animated.View>
        </View>

        {/* پنل ایموجی — جایگزین کیبورد (مثل تلگرام)، با انیمیشن نرم */}
        {emojiPanelMounted ? (
          <Animated.View
            style={[styles.emojiPanel, emojiPanelAnimStyle]}
            pointerEvents={emojiSwap.emojiOpen ? 'auto' : 'none'}
          >
            <View style={{ height: emojiPanelH }}>
              <EmojiKeyboard
                onEmojiSelected={onPickEmoji}
                enableRecentlyUsed
                enableSearchBar
                hideHeader
                categoryPosition="bottom"
                defaultHeight="100%"
                disableSafeArea
                colorScheme="dark"
                theme={emojiTheme}
                translation={EMOJI_FA}
                storage={emojiStorage}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>

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
  wrap: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  emojiPanel: {
    width: '100%',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    overflow: 'hidden',
  },
  emojiIconStack: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** لایهٔ keypad روی happy سوار می‌شود. */
  emojiIconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: ROW_LTR,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputShell: {
    flex: 1,
    flexDirection: ROW_LTR,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: colors.surface2,
    paddingHorizontal: SHELL_INSET,
    overflow: 'hidden',
  },
  inputShellMulti: {
    alignItems: 'flex-end',
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  attachSlot: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtn: {
    width: ATTACH_SLOT,
    height: ATTACH_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    maxHeight: INPUT_MAX_H,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 9 : 8,
    paddingBottom: Platform.OS === 'ios' ? 9 : 8,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: INPUT_FONT,
    lineHeight: INPUT_LINE_H,
    writingDirection: 'rtl',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionCancel: {
    borderWidth: 0,
  },
  actionOff: { opacity: 0.42 },
  // هم‌ارتفاع با کپسول؛ حلقه‌ی ضبط فقط موقع رکورد بزرگ می‌شود
  micHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconStack: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // —— نوار ضبط (الگوی تلگرام) ——
  recShell: {
    paddingLeft: spacing.md,
  },
  recBody: {
    flex: 1,
    flexDirection: ROW_LTR,
    alignItems: 'center',
    minWidth: 0,
    gap: spacing.sm,
  },
  recLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.rose,
  },
  recTime: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    minWidth: 40,
    fontVariant: ['tabular-nums'],
  },
  recWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
    minWidth: 52,
  },
  recBarTick: {
    width: 2.5,
    borderRadius: 1.5,
  },
  recHintStage: {
    flex: 1,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recHintRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  recHintRelease: {
    gap: 6,
  },
  recHint: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink3,
  },
  recHintCancel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.rose,
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
