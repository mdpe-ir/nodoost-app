import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { ProofPicker } from '@/presentation/components/ProofPicker';
import { tierName } from '@/presentation/components/TierBadge';
import { useMissionDetailViewModel } from '@/presentation/hooks/useMissionDetailViewModel';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import type { Mission, MissionStep } from '@/domain/entities';

const REPEAT_LABEL: Record<Mission['repeatMode'], string> = {
  once: 'یک‌بار',
  daily: 'هر روز',
  weekly: 'هر هفته',
  limited: 'چند بار',
  unlimited: 'بی‌شمار',
};

/**
 * صفحه‌ی جزئیاتِ یک ماموریت: چه کاری، با چه مراحلی، با چه قوانینی — و اگر
 * مدرک لازم است، جای فرستادنش.
 *
 * وضعیتِ دکمه‌ها را سرور تعیین می‌کند (attemptsLeft / state / locked)؛ ویومدل
 * فقط همان شرط‌ها را برای بی‌درنگ‌کردنِ رابط بازتاب می‌دهد.
 */
export function MissionDetailScreen({ missionId }: { missionId: number }) {
  const vm = useMissionDetailViewModel(missionId);
  const [picker, setPicker] = useState(false);

  // تیکِ ثانیه‌ای فقط وقتی ماموریتِ اعتمادی منتظرِ فعال‌شدنِ دکمه است.
  const [now, setNow] = useState(() => Date.now());
  const readyAt = vm.mission?.readyAt ? new Date(vm.mission.readyAt).getTime() : 0;
  const waiting = vm.mission?.verifyKind === 'honor' && readyAt > now;
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="ماموریت" />
        <RowsSkeleton />
      </ScreenContainer>
    );
  }

  if (vm.notFound || !vm.mission) {
    return (
      <ScreenContainer>
        <StackHeader title="ماموریت" />
        <EmptyState
          icon={vm.error ? 'rewind' : 'star'}
          title={vm.error ? 'بارگذاری نشد' : 'این ماموریت دیگر در دسترس نیست'}
          hint={vm.error ? 'اتصالت را بررسی کن.' : 'شاید تمام شده یا برداشته شده باشد.'}
          actionLabel={vm.error ? 'تلاشِ دوباره' : 'بازگشت به ماموریت‌ها'}
          onAction={vm.error ? vm.reload : () => router.replace('/arena' as Href)}
        />
      </ScreenContainer>
    );
  }

  const m = vm.mission;
  const readyIn = readyAt ? Math.max(0, Math.ceil((readyAt - now) / 1000)) : 0;

  return (
    <ScreenContainer>
      <StackHeader title="ماموریت" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Hero mission={m} />
        <StatusRibbon mission={m} />

        {m.description ? (
          <Section title="چه کاری باید انجام بدهی؟">
            <Text style={styles.body}>{m.description}</Text>
          </Section>
        ) : null}

        {m.threshold > 1 && m.state !== 'completed' ? (
          <Section title="پیشرفتِ تو">
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(100, Math.round((m.progress / m.threshold) * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {faNum(Math.min(m.progress, m.threshold))} از {faNum(m.threshold)}
            </Text>
          </Section>
        ) : null}

        {m.steps.length > 0 ? (
          <Section title="مراحلِ انجام">
            {m.steps.map((s, i) => (
              <StepRow key={`${s.title}-${i}`} step={s} index={i} last={i === m.steps.length - 1} />
            ))}
          </Section>
        ) : null}

        {m.rules.length > 0 ? (
          <Section title="قوانین">
            {m.rules.map((r, i) => (
              <View key={`${r}-${i}`} style={styles.ruleRow}>
                <View style={styles.bullet} />
                <Text style={styles.ruleText}>{r}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {m.verifyKind === 'manual' && m.proofKind !== 'none' && !m.locked ? (
          <ProofSection vm={vm} onPick={() => setPicker(true)} />
        ) : null}

        {m.locked ? (
          <View style={styles.lockCard}>
            <Icon name="lock" size={16} tint="ink" />
            <Text style={styles.lockText}>
              {m.lockReason === 'tier'
                ? `این ماموریت برای ${tierName(m.minTier)} به بالاست.`
                : 'اول پروفایلت را کامل کن تا این ماموریت باز شود.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomCTA mission={m} vm={vm} readyIn={readyIn} />

      <ProofPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPicked={(uri) => void vm.addProof(uri)}
        onError={(msg) => {
          setPicker(false);
          // خطای پردازشِ محلیِ عکس (HEIC غیرقابلِ‌تبدیل، فایلِ خراب) باید همان‌قدر
          // دیده شود که خطای سرور؛ وگرنه دکمه بی‌صدا کاری نمی‌کند.
          vm.showToast(msg);
        }}
      />

      {vm.toast ? (
        <Pressable style={styles.toast} onPress={vm.clearToast}>
          <Text style={styles.toastText}>{vm.toast}</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

function Hero({ mission }: { mission: Mission }) {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.hero}>
      {mission.badgeUrl ? (
        <Image source={{ uri: mission.badgeUrl }} style={styles.badge} contentFit="cover" />
      ) : (
        <View style={styles.badgeFallback}>
          <Icon name="star" size={32} tint="gold" />
        </View>
      )}
      <Text style={styles.heroTitle}>{mission.title}</Text>
      {mission.summary ? <Text style={styles.heroSummary}>{mission.summary}</Text> : null}
      <View style={styles.chips}>
        <View style={[styles.chip, styles.chipGold]}>
          <Text style={styles.chipGoldText}>{faNum(mission.points)} امتیاز</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{REPEAT_LABEL[mission.repeatMode]}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * نوارِ وضعیت فقط وقتی ظاهر می‌شود که چیزی برای گفتن باشد. مهم‌ترینش «در
 * انتظارِ بررسی» و «رد شد» است: بدونِ این دو، کاربر منتظرِ امتیازی می‌ماند که
 * یا هنوز نیامده یا هرگز نمی‌آید.
 */
function StatusRibbon({ mission }: { mission: Mission }) {
  if (mission.state === 'completed') {
    return (
      // فنر، نه محوشدن: تکمیلِ ماموریت دستاورد است و باید مثلِ دستاورد بنشیند.
      <Animated.View entering={ZoomIn.springify().damping(13).stiffness(200)} style={[styles.ribbon, styles.ribbonOk]}>
        <Icon name="check" size={16} tint="gold" />
        <Text style={styles.ribbonOkText}>انجام شد — {faNum(mission.points)} امتیاز گرفتی.</Text>
      </Animated.View>
    );
  }
  if (mission.state === 'pending_review') {
    return (
      <View style={styles.ribbon}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.ribbonText}>
          مدرکت فرستاده شد و در انتظارِ بررسی است — معمولاً تا {faNum(mission.reviewSlaHours)} ساعت.
          بعد از تأیید {faNum(mission.points)} امتیاز می‌گیری.
        </Text>
      </View>
    );
  }
  if (mission.state === 'rejected') {
    return (
      <View style={[styles.ribbon, styles.ribbonBad]}>
        <Icon name="close" size={16} tint="ink" />
        <View style={{ flex: 1 }}>
          <Text style={styles.ribbonBadText}>مدرکت تأیید نشد.</Text>
          {mission.reviewNote ? (
            <Text style={styles.ribbonNote}>{mission.reviewNote}</Text>
          ) : null}
          <Text style={styles.ribbonNote}>
            {mission.attemptsLeft > 0
              ? `${faNum(mission.attemptsLeft)} بارِ دیگر می‌توانی بفرستی.`
              : 'دفعاتِ ارسال تمام شده.'}
          </Text>
        </View>
      </View>
    );
  }
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** مرحله با شماره و خطِ اتصال؛ href آن را از متنِ مرده به دکمه تبدیل می‌کند. */
function StepRow({ step, index, last }: { step: MissionStep; index: number; last: boolean }) {
  const go = () => {
    if (!step.href) return;
    if (step.href.startsWith('/')) router.push(step.href as never);
    else void Linking.openURL(step.href).catch(() => undefined);
  };

  return (
    <Pressable
      onPress={step.href ? go : undefined}
      disabled={!step.href}
      accessibilityRole={step.href ? 'button' : undefined}
      style={styles.stepRow}
    >
      <View style={styles.stepRail}>
        <View style={styles.stepDot}>
          <Text style={styles.stepNum}>{faNum(index + 1)}</Text>
        </View>
        {last ? null : <View style={styles.stepLine} />}
      </View>
      <View style={styles.stepBody}>
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {step.href ? <Icon name="chevron-prev" size={14} tint="gold" /> : null}
        </View>
        {step.body ? <Text style={styles.stepText}>{step.body}</Text> : null}
      </View>
    </Pressable>
  );
}

type VM = ReturnType<typeof useMissionDetailViewModel>;

function ProofSection({ vm, onPick }: { vm: VM; onPick: () => void }) {
  const m = vm.mission!;
  const wantsImages = m.proofKind === 'image' || m.proofKind === 'image_and_text';
  const wantsText = m.proofKind === 'text' || m.proofKind === 'image_and_text';
  const editable = m.state !== 'pending_review' && m.state !== 'completed' && m.attemptsLeft > 0;

  return (
    <Section title="ارسالِ مدرک">
      <Text style={styles.body}>
        {m.proofLabel ||
          (wantsImages ? 'عکسِ مدرک را بفرست تا بررسی شود.' : 'توضیحِ لازم را بنویس.')}
      </Text>

      {wantsImages ? (
        <>
          <View style={styles.grid}>
            {m.proofs.map((p) => (
              <View key={p.id} style={styles.thumbWrap}>
                <Image source={{ uri: p.url }} style={styles.thumb} contentFit="cover" />
                {editable ? (
                  <Pressable
                    onPress={() => void vm.removeProof(p.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="حذفِ عکس"
                    style={styles.thumbX}
                  >
                    <Icon name="close" size={12} tint="ink" />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {vm.canAddProof ? (
              <Pressable
                onPress={onPick}
                disabled={vm.uploading}
                accessibilityRole="button"
                accessibilityLabel="افزودنِ عکس"
                style={[styles.thumbWrap, styles.thumbAdd]}
              >
                {vm.uploading ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : (
                  <Icon name="plus" size={22} tint="gold" />
                )}
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.hint}>
            {faNum(m.proofs.length)} از {faNum(m.proofMaxImages)} عکس
            {m.proofMinImages > 0 ? ` — دستِ‌کم ${faNum(m.proofMinImages)} تا لازم است` : ''}
          </Text>
        </>
      ) : null}

      {wantsText ? (
        <TextInput
          value={vm.proofText}
          onChangeText={vm.setProofText}
          editable={editable}
          placeholder="توضیح، کد یا لینک"
          placeholderTextColor={colors.ink3}
          style={[styles.input, !editable && styles.inputDim]}
          multiline
        />
      ) : null}
    </Section>
  );
}

/**
 * دکمه‌ی چسبیده به پایین — تنها کنشِ اصلیِ صفحه. متن و رفتارش از نوعِ تأیید و
 * وضعیتِ کاربر می‌آید تا هیچ‌وقت دو دکمه‌ی رقیب روی صفحه نباشد.
 */
function BottomCTA({ mission, vm, readyIn }: { mission: Mission; vm: VM; readyIn: number }) {
  const m = mission;
  if (m.state === 'completed') return null;

  if (m.locked) {
    return (
      <View style={styles.footer}>
        <Button
          label={m.lockReason === 'tier' ? 'ارتقای عضویت' : 'تکمیلِ پروفایل'}
          onPress={() => router.push(m.lockReason === 'tier' ? '/plans' : '/edit-profile')}
        />
      </View>
    );
  }

  if (m.verifyKind === 'manual') {
    if (m.state === 'pending_review') {
      return (
        <View style={styles.footer}>
          <Button label="در انتظارِ بررسی" disabled onPress={() => {}} />
        </View>
      );
    }
    return (
      <View style={styles.footer}>
        {m.ctaUrl ? (
          <Button
            label={m.ctaLabel || 'رفتن به مقصد'}
            variant="outline"
            size="sm"
            onPress={() => {
              if (m.ctaUrl!.startsWith('/')) router.push(m.ctaUrl as never);
              else void Linking.openURL(m.ctaUrl!).catch(() => undefined);
            }}
            style={styles.footerSecondary}
          />
        ) : null}
        <Button
          label={m.state === 'rejected' ? 'ارسالِ دوباره' : 'ارسال برای بررسی'}
          loading={vm.busy}
          disabled={!vm.canSubmit}
          onPress={() => void vm.claim()}
        />
      </View>
    );
  }

  if (m.verifyKind === 'honor') {
    if (!m.startedAt) {
      return (
        <View style={styles.footer}>
          <Button
            label={m.ctaLabel || 'برو انجامش بده'}
            loading={vm.busy}
            onPress={async () => {
              await vm.start();
              if (m.ctaUrl) {
                if (m.ctaUrl.startsWith('/')) router.push(m.ctaUrl as never);
                else void Linking.openURL(m.ctaUrl).catch(() => undefined);
              }
            }}
          />
        </View>
      );
    }
    if (readyIn > 0) {
      return (
        <View style={[styles.footer, styles.footerWait]}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.waitText}>
            {faNum(readyIn)} ثانیه تا فعال‌شدنِ دکمه‌ی «انجامش دادم»
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.footer}>
        <Button label="انجامش دادم" loading={vm.busy} onPress={() => void vm.claim()} />
      </View>
    );
  }

  // auto و callback: کاربر کاری در این صفحه ندارد جز رفتن به مقصد.
  if (m.ctaUrl) {
    return (
      <View style={styles.footer}>
        <Button
          label={m.ctaLabel || 'بریم'}
          onPress={() => {
            if (m.ctaUrl!.startsWith('/')) router.push(m.ctaUrl as never);
            else void Linking.openURL(m.ctaUrl!).catch(() => undefined);
          }}
        />
      </View>
    );
  }
  return null;
}

const THUMB = 92;

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.lg },

  hero: { alignItems: 'center', gap: spacing.sm },
  badge: { width: 96, height: 96, borderRadius: radius.xl },
  badgeFallback: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  heroSummary: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  chips: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  chipGold: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  chipText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink2 },
  chipGoldText: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.gold },

  ribbon: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  ribbonOk: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  ribbonBad: { borderColor: colors.line, borderTopColor: colors.rim, backgroundColor: colors.surface2 },
  ribbonText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ribbonOkText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ribbonBadText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ribbonNote: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  section: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  bar: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.gold },
  progressText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  stepRow: { flexDirection: 'row-reverse', gap: spacing.md },
  stepRail: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  stepNum: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.gold },
  stepLine: { flex: 1, width: 1, backgroundColor: colors.line, marginVertical: spacing.xs },
  stepBody: { flex: 1, paddingBottom: spacing.md, gap: spacing.xs },
  stepTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  stepTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  ruleRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 7,
  },
  ruleText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  thumb: { width: '100%', height: '100%' },
  thumbAdd: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  thumbX: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,5,11,0.72)',
  },

  input: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
  },
  inputDim: { opacity: 0.6 },

  lockCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  lockText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  footer: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  footerSecondary: { alignSelf: 'stretch' },
  footerWait: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl,
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
  waitText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
});
