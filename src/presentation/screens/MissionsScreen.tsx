import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { RankBadge } from '@/presentation/components/RankBadge';
import { RankSheet } from '@/presentation/components/RankSheet';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { tierName } from '@/presentation/components/TierBadge';
import { useMissionsViewModel } from '@/presentation/hooks/useMissionsViewModel';
import { faNum } from '@/core/utils/faNum';
import { timeAgo } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import type { Mission, PointsState, Redemption, Reward } from '@/domain/entities';

type Tab = 'missions' | 'rewards' | 'points';

const TABS: { key: Tab; label: string }[] = [
  { key: 'missions', label: 'ماموریت‌ها' },
  { key: 'rewards', label: 'جوایز' },
  { key: 'points', label: 'امتیازِ من' },
];

const LOCK_TEXT: Record<string, string> = {
  tier: 'برای سطح‌های بالاتر',
  profile: 'اول پروفایلت را کامل کن',
};

const BLOCK_TEXT: Record<string, string> = {
  points: 'امتیازت کافی نیست',
  rank: 'رتبه‌ات کافی نیست',
  stock: 'موجودی تمام شد',
  limit: 'سقفِ دریافتت پر شده',
  tier_cap: 'این سطح با امتیاز داده نمی‌شود',
  monthly_cap: 'سقفِ این ماه پر شده',
};

const REDEMPTION_TEXT: Record<Redemption['status'], string> = {
  pending: 'در حالِ انجام',
  fulfilled: 'انجام شد',
  rejected: 'انجام نشد — امتیاز برگشت',
  cancelled: 'لغو شد',
};

/**
 * صفحه‌ی امتیاز و ماموریت — سه بخش: کارهایی که می‌شود کرد، چیزهایی که می‌شود
 * گرفت، و دفترِ خودِ کاربر.
 *
 * سرور تصمیم می‌گیرد هر دکمه فعال باشد یا نه (claimable/redeemable) و اپ فقط
 * روایتش می‌کند؛ هیچ سقفی این‌جا دوباره حساب نمی‌شود.
 */
export function MissionsScreen() {
  const vm = useMissionsViewModel();
  const [tab, setTab] = useState<Tab>('missions');
  const [rankSheet, setRankSheet] = useState(false);

  // «الان» به‌عنوانِ state نگه داشته می‌شود، نه Date.now() وسطِ رندر: خواندنِ
  // ساعت هنگامِ رندر ناخالص است و نتیجه‌اش با هر رندرِ اتفاقی تغییر می‌کند.
  const [now, setNow] = useState(() => Date.now());
  // تیکِ ثانیه‌ای فقط وقتی لازم است که یک ماموریتِ اعتمادی منتظرِ فعال‌شدنِ
  // دکمه‌ی «انجامش دادم» باشد؛ در بقیه‌ی حالت‌ها هیچ رندری تحمیل نمی‌شود.
  const waiting = useMemo(
    () =>
      (vm.overview?.missions ?? []).some(
        (m) => m.verifyKind === 'honor' && m.readyAt && new Date(m.readyAt).getTime() > now
      ),
    [vm.overview, now]
  );
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  const points = vm.points;

  return (
    <ScreenContainer>
      <StackHeader title="امتیاز و ماموریت" />

      {vm.overview && !vm.overview.enabled ? (
        <EmptyState
          icon="star"
          title="بخشِ امتیاز فعلاً غیرفعال است"
          hint="به‌زودی برمی‌گردد."
        />
      ) : (
        <>
          <PointsHeader points={points} onRankPress={() => setRankSheet(true)} />

          <View style={styles.tabs}>
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </View>

          {vm.loading ? (
            <RowsSkeleton />
          ) : vm.error ? (
            <EmptyState
              icon="rewind"
              title="بارگذاری نشد"
              hint="اتصالت را بررسی کن."
              actionLabel="تلاشِ دوباره"
              onAction={vm.reload}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={vm.refreshing}
                  onRefresh={vm.refresh}
                  tintColor={colors.gold}
                />
              }
            >
              {tab === 'missions' && (
                <MissionsTab vm={vm} now={now} onInvite={() => router.push('/invite')} />
              )}
              {tab === 'rewards' && <RewardsTab vm={vm} />}
              {tab === 'points' && <PointsTab vm={vm} />}
            </ScrollView>
          )}
        </>
      )}

      {vm.toast ? (
        <Pressable style={styles.toast} onPress={vm.clearToast}>
          <Text style={styles.toastText}>{vm.toast}</Text>
        </Pressable>
      ) : null}

      <RankSheet
        visible={rankSheet}
        rank={points?.rank}
        earned={points?.earned}
        nextRank={points?.nextRank}
        toNext={points?.toNext}
        onDismiss={() => setRankSheet(false)}
      />
    </ScreenContainer>
  );
}

/** نوارِ بالای صفحه: موجودی، رتبه و نوارِ پیشرفت تا رتبه‌ی بعدی. */
function PointsHeader({
  points,
  onRankPress,
}: {
  points: PointsState | null;
  onRankPress: () => void;
}) {
  if (!points) return null;
  const span = points.nextRank ? points.nextRank.minPoints - (points.rank?.minPoints ?? 0) : 0;
  const done = span > 0 ? Math.min(1, Math.max(0, (span - points.toNext) / span)) : 1;

  return (
    <View style={styles.head}>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headLabel}>امتیازِ من</Text>
          <Text style={styles.headValue}>{faNum(points.balance)}</Text>
        </View>
        <RankBadge rank={points.rank} height={26} onPress={onRankPress} />
      </View>

      {points.nextRank ? (
        <>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(done * 100)}%` }]} />
          </View>
          <Text style={styles.headHint}>
            {faNum(points.toNext)} امتیاز تا «{points.nextRank.name}»
          </Text>
        </>
      ) : (
        <Text style={styles.headHint}>به بالاترین رتبه رسیده‌ای 🎉</Text>
      )}
    </View>
  );
}

type VM = ReturnType<typeof useMissionsViewModel>;

function MissionsTab({ vm, now, onInvite }: { vm: VM; now: number; onInvite: () => void }) {
  const ov = vm.overview;
  if (!ov) return null;
  const open = ov.missions.filter((m) => m.state !== 'completed');
  const done = ov.missions.filter((m) => m.state === 'completed');

  return (
    <>
      {ov.referralCard ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Pressable
            onPress={onInvite}
            style={({ pressed }) => [styles.card, styles.inviteCard, pressed && styles.pressed]}
          >
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{ov.referralCard.title}</Text>
                <Text style={styles.cardDesc}>{ov.referralCard.description}</Text>
              </View>
              <Text style={styles.reward}>+{faNum(ov.referralCard.points)}</Text>
            </View>
            <View style={styles.inviteCta}>
              <Icon name="chevron-prev" size={16} tint="gold" />
              <Text style={styles.inviteCtaText}>{ov.referralCard.ctaLabel}</Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {open.map((m) => (
        <MissionCard key={m.id} mission={m} vm={vm} now={now} />
      ))}

      {done.length ? (
        <>
          <Text style={styles.sectionTitle}>انجام‌شده</Text>
          {done.map((m) => (
            <MissionCard key={m.id} mission={m} vm={vm} now={now} />
          ))}
        </>
      ) : null}

      {!ov.missions.length && !ov.referralCard ? (
        <EmptyState icon="star" title="فعلاً ماموریتی نیست" hint="به‌زودی سر بزن." />
      ) : null}
    </>
  );
}

function MissionCard({ mission, vm, now }: { mission: Mission; vm: VM; now: number }) {
  const [proof, setProof] = useState('');
  const busy = vm.busyMission === mission.id;
  const doneState = mission.state === 'completed';
  const pending = mission.state === 'pending_review';

  const readyIn = mission.readyAt
    ? Math.max(0, Math.ceil((new Date(mission.readyAt).getTime() - now) / 1000))
    : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      style={[styles.card, (doneState || mission.locked) && styles.cardDim]}
    >
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{mission.title}</Text>
          {mission.description ? (
            <Text style={styles.cardDesc}>{mission.description}</Text>
          ) : null}
        </View>
        <Text style={[styles.reward, doneState && styles.rewardDone]}>
          {doneState ? '✓' : `+${faNum(mission.points)}`}
        </Text>
      </View>

      {mission.threshold > 1 && !doneState ? (
        <>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.min(100, Math.round((mission.progress / mission.threshold) * 100))}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {faNum(Math.min(mission.progress, mission.threshold))} از {faNum(mission.threshold)}
          </Text>
        </>
      ) : null}

      {mission.locked ? (
        <View style={styles.lockRow}>
          <Icon name="lock" size={14} tint="ink" />
          <Text style={styles.lockText}>
            {mission.lockReason === 'tier'
              ? `${LOCK_TEXT.tier} (${tierName(mission.minTier)} به بالا)`
              : LOCK_TEXT[mission.lockReason ?? 'profile']}
          </Text>
        </View>
      ) : pending ? (
        <Text style={styles.pendingText}>فرستاده شد؛ در انتظارِ بررسی.</Text>
      ) : doneState ? null : mission.verifyKind === 'honor' ? (
        <HonorActions mission={mission} vm={vm} busy={busy} readyIn={readyIn} />
      ) : mission.verifyKind === 'manual' ? (
        <View style={styles.manual}>
          <TextInput
            value={proof}
            onChangeText={setProof}
            placeholder="توضیح یا لینکِ مدرک"
            placeholderTextColor={colors.ink3}
            style={styles.input}
            multiline
          />
          <Button
            label="ارسال برای بررسی"
            size="sm"
            variant="outline"
            loading={busy}
            onPress={() => vm.claim(mission.id, proof.trim())}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * ماموریتِ اعتمادی: «برو انجام بده» صفحه‌ی مقصد را باز و تایمر را مسلح می‌کند؛
 * بعد از پایانِ تایمر دکمه‌ی «انجامش دادم» فعال می‌شود. تأییدِ بی‌قید است و
 * همین را هم صریح می‌گوییم.
 */
function HonorActions({
  mission,
  vm,
  busy,
  readyIn,
}: {
  mission: Mission;
  vm: VM;
  busy: boolean;
  readyIn: number;
}) {
  if (!mission.startedAt) {
    return (
      <Button
        label={mission.ctaLabel || 'برو انجامش بده'}
        size="sm"
        loading={busy}
        onPress={async () => {
          await vm.start(mission.id);
          if (mission.ctaUrl) {
            if (mission.ctaUrl.startsWith('/')) router.push(mission.ctaUrl as never);
            else void Linking.openURL(mission.ctaUrl).catch(() => undefined);
          }
        }}
        style={{ marginTop: spacing.md }}
      />
    );
  }
  if (readyIn > 0) {
    return (
      <View style={[styles.waitRow, { marginTop: spacing.md }]}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.waitText}>
          {faNum(readyIn)} ثانیه تا فعال‌شدنِ دکمه‌ی «انجامش دادم»
        </Text>
      </View>
    );
  }
  return (
    <Button
      label="انجامش دادم"
      size="sm"
      loading={busy}
      onPress={() => vm.claim(mission.id)}
      style={{ marginTop: spacing.md }}
    />
  );
}

function RewardsTab({ vm }: { vm: VM }) {
  const rw = vm.rewards;
  if (!rw) return null;

  return (
    <>
      {rw.subCap.monthlyDays > 0 ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            در هر ماه تا {faNum(rw.subCap.monthlyDays)} روز اشتراک با امتیاز می‌گیری؛
            {' '}
            {faNum(rw.subCap.remainingDays)} روزش مانده.
          </Text>
        </View>
      ) : null}

      {rw.rewards.map((r) => (
        <RewardCard key={r.id} reward={r} vm={vm} />
      ))}

      {!rw.rewards.length ? (
        <EmptyState icon="star" title="فعلاً جایزه‌ای نیست" hint="به‌زودی سر بزن." />
      ) : null}

      {vm.redemptions.length ? (
        <>
          <Text style={styles.sectionTitle}>جوایزی که گرفته‌ام</Text>
          {vm.redemptions.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{r.rewardTitle}</Text>
                <Text style={styles.rowHint}>
                  {REDEMPTION_TEXT[r.status]}
                  {r.queued ? ' — بعد از پایانِ اشتراکِ فعلی' : ''} · {timeAgo(r.createdAt)}
                </Text>
              </View>
              <Text style={styles.rowValue}>−{faNum(r.cost)}</Text>
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}

function RewardCard({ reward, vm }: { reward: Reward; vm: VM }) {
  const [input, setInput] = useState('');
  const busy = vm.busyReward === reward.id;

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      style={[styles.card, !reward.redeemable && styles.cardDim]}
    >
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{reward.title}</Text>
          {reward.description ? <Text style={styles.cardDesc}>{reward.description}</Text> : null}
          {reward.queueNotice ? (
            <Text style={styles.queueNotice}>
              چون اشتراکِ بالاتری داری، این جایزه بعد از پایانِ آن فعال می‌شود.
            </Text>
          ) : null}
          {reward.stockLeft !== undefined && reward.stockLeft <= 5 ? (
            <Text style={styles.stockText}>فقط {faNum(reward.stockLeft)} عدد مانده</Text>
          ) : null}
        </View>
        <Text style={styles.cost}>{faNum(reward.cost)}</Text>
      </View>

      {reward.kind === 'manual' && reward.inputLabel && reward.redeemable ? (
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={reward.inputLabel}
          placeholderTextColor={colors.ink3}
          style={styles.input}
        />
      ) : null}

      {reward.redeemable ? (
        <Button
          label="دریافت"
          size="sm"
          loading={busy}
          onPress={() => vm.redeem(reward.id, input.trim() || undefined)}
          style={{ marginTop: spacing.md }}
        />
      ) : (
        <View style={styles.lockRow}>
          <Icon name="lock" size={14} tint="ink" />
          <Text style={styles.lockText}>{BLOCK_TEXT[reward.reason ?? 'points']}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function PointsTab({ vm }: { vm: VM }) {
  const p = vm.points;
  if (!p) return null;
  return (
    <>
      <View style={styles.card}>
        <View style={styles.statRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>موجودیِ خرج‌شدنی</Text>
            <Text style={styles.statValue}>{faNum(p.balance)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>مجموعِ کسب‌شده</Text>
            <Text style={styles.statValue}>{faNum(p.earned)}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>
          خرج‌کردنِ امتیاز برای جایزه، مجموعِ کسب‌شده و رتبه‌ات را کم نمی‌کند.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>تاریخچه</Text>
      {vm.ledger.length ? (
        vm.ledger.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{e.title}</Text>
              <Text style={styles.rowHint}>{timeAgo(e.createdAt)}</Text>
            </View>
            <Text style={[styles.rowValue, e.delta > 0 ? styles.plus : styles.minus]}>
              {e.delta > 0 ? '+' : '−'}
              {faNum(Math.abs(e.delta))}
            </Text>
          </View>
        ))
      ) : (
        <EmptyState icon="star" title="هنوز امتیازی نگرفته‌ای" hint="اولین ماموریت را انجام بده." />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  head: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  headLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.gold2,
    textAlign: 'right',
  },
  headHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  tabs: { marginBottom: spacing.lg },
  list: { paddingBottom: spacing.xxl * 2, gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardDim: { opacity: 0.55 },
  inviteCard: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  pressed: { opacity: 0.8 },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  reward: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.gold2 },
  rewardDone: { color: colors.ok },
  cost: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.gold2 },

  inviteCta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  inviteCtaText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },

  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    marginTop: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.gold },
  progressText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  lockRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  lockText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  pendingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.md,
  },
  queueNotice: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  stockText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  waitRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  waitText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },

  manual: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.md,
  },

  note: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.lg,
  },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  rowValue: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink2 },
  plus: { color: colors.ok },
  minus: { color: colors.rose },

  statRow: { flexDirection: 'row-reverse', gap: spacing.lg },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.gold2,
    textAlign: 'right',
  },

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
});
