import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { PressableScale } from '@/presentation/components/PressableScale';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { inviteShareCaption, useInviteViewModel } from '@/presentation/hooks/useInviteViewModel';
import { faNum } from '@/core/utils/faNum';
import { clipboardAvailable, copyToClipboard } from '@/core/utils/clipboard';
import { timeAgo } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';
import type { Invitee, ReferralStatus } from '@/domain/entities';

const STATUS_TEXT: Record<ReferralStatus, string> = {
  pending: 'در انتظارِ کامل‌کردنِ پروفایل',
  qualified: 'امتیازت را گرفتی',
  rejected: 'تأیید نشد',
  reversed: 'ابطال شد',
};

const STATUS_COLOR: Record<ReferralStatus, string> = {
  pending: colors.ink3,
  qualified: colors.ok,
  rejected: colors.rose,
  reversed: colors.rose,
};

/**
 * صفحه‌ی دعوت از دوستان — کدِ من، اشتراک‌گذاری، و فهرستِ کسانی که آورده‌ام.
 *
 * نکته‌ی مهمِ محصولی که همین‌جا صریح گفته می‌شود: امتیازِ دعوت وقتی می‌آید که
 * دوستت پروفایلش را کامل کند، نه لحظه‌ی ثبت‌نام. بدونِ گفتنِ این، کاربر فکر
 * می‌کند سیستم خراب است.
 */
export function InviteScreen() {
  const vm = useInviteViewModel();
  const router = useRouter();
  const s = vm.data?.summary;

  // بازخوردِ «کپی شد» خودش بعد از دو ثانیه می‌رود. تایمر در ref نگه داشته
  // می‌شود تا ضربه‌های پشتِ‌هم تایمرِ قبلی را جا نگذارند.
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const shareText = s ? inviteShareCaption(s) : '';

  const share = () => void Share.share({ message: shareText }).catch(() => undefined);

  /**
   * ضربه روی کد: رونوشت، و اگر این نسخه‌ی اپ رونوشت ندارد (باینریِ قدیمی که
   * فقط OTA گرفته) بی‌سروصدا برگه‌ی اشتراک‌گذاری باز می‌شود — که خودش گزینه‌ی
   * رونوشت دارد. کاربر هیچ‌وقت به بن‌بست نمی‌خورد.
   */
  const onCodePress = async (code: string) => {
    if (await copyToClipboard(code)) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
      return;
    }
    share();
  };

  return (
    <ScreenContainer>
      <StackHeader title="دعوت از دوستان" />

      {vm.loading ? (
        <RowsSkeleton />
      ) : vm.error || !s ? (
        <EmptyState
          icon="rewind"
          title="بارگذاری نشد"
          hint="اتصالت را بررسی کن."
          actionLabel="تلاشِ دوباره"
          onAction={vm.reload}
        />
      ) : !s.enabled ? (
        <EmptyState icon="star" title="دعوت از دوستان فعلاً غیرفعال است" />
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
          <Animated.View entering={FadeInDown.duration(240)} style={styles.codeCard}>
            <Text style={styles.codeLabel}>کدِ دعوتِ من</Text>
            {/* ضربه روی کد = رونوشت (کارِ رایج‌تر)؛ فرستادن دکمه‌ی جداگانه دارد.
                روی نسخه‌ای که رونوشت ندارد، همین ضربه برگه‌ی اشتراک‌گذاری را
                باز می‌کند و متنِ راهنما هم همان را می‌گوید. */}
            <PressableScale
              scaleTo={0.98}
              feedback="select"
              onPress={() => void onCodePress(s.code)}
              accessibilityRole="button"
              accessibilityLabel={clipboardAvailable ? 'رونوشتِ کدِ دعوت' : 'فرستادنِ کدِ دعوت'}
              style={styles.codeBox}
            >
              <Text style={styles.code}>{s.code}</Text>
              <View style={styles.copyTag}>
                <Icon
                  name={copied ? 'check' : clipboardAvailable ? 'edit' : 'send-fill'}
                  size={13}
                  tint="gold"
                />
                <Text style={styles.copyTagText}>
                  {copied ? 'کپی شد' : clipboardAvailable ? 'رونوشت' : 'فرستادن'}
                </Text>
              </View>
            </PressableScale>
            <Text style={styles.codeHint}>
              {clipboardAvailable ? 'برای رونوشت روی کد بزن.' : 'برای فرستادن روی کد بزن.'}
            </Text>

            <Button
              label="فرستادن برای دوستان"
              icon="send-fill"
              onPress={share}
              style={{ marginTop: spacing.lg }}
            />
            {Platform.OS !== 'web' ? (
              <Button
                label="ساخت پست"
                variant="outline"
                onPress={() => router.push('/invite/card' as Href)}
                style={{ marginTop: spacing.sm }}
              />
            ) : null}
          </Animated.View>

          <View style={styles.statsRow}>
            <Stat label="دعوتِ موفق" value={s.qualified} />
            <Stat label="در انتظار" value={s.pending} />
            <Stat label="امتیازِ گرفته‌شده" value={s.pointsEarned} />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              به‌ازای هر دوستی که با کدِ تو بیاید و پروفایلش را کامل کند،{' '}
              <Text style={styles.noteStrong}>{faNum(s.inviterPoints)} امتیاز</Text> می‌گیری.
              خودِ او هم {faNum(s.inviteePoints)} امتیازِ خوش‌آمد می‌گیرد.
            </Text>
          </View>

          {s.canEnterCode ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>کدِ دعوت داری؟</Text>
              <Text style={styles.cardDesc}>
                اگر کسی تو را دعوت کرده، کدش را این‌جا وارد کن و{' '}
                {faNum(s.inviteePoints)} امتیازِ هدیه بگیر.
                {s.graceDays > 0
                  ? ` این کار فقط تا ${faNum(s.graceDays)} روز پس از ثبت‌نام ممکن است.`
                  : ''}
              </Text>
              <TextInput
                value={vm.code}
                onChangeText={vm.setCode}
                placeholder="مثلاً AB3D4F"
                placeholderTextColor={colors.ink3}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                style={styles.input}
              />
              {vm.message ? (
                <Text style={[styles.message, vm.success ? styles.ok : styles.bad]}>
                  {vm.message}
                </Text>
              ) : null}
              <Button
                label="ثبتِ کد"
                size="md"
                variant="outline"
                loading={vm.submitting}
                onPress={vm.submitCode}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>دوستانی که آورده‌ام</Text>
          {vm.data?.invitees.length ? (
            vm.data.invitees.map((inv) => <InviteeRow key={inv.id} invitee={inv} />)
          ) : (
            <EmptyState
              icon="star"
              title="هنوز کسی را دعوت نکرده‌ای"
              hint="کدت را برای دوستانت بفرست."
            />
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{faNum(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InviteeRow({ invitee }: { invitee: Invitee }) {
  return (
    <View style={styles.row}>
      {invitee.photoUrl ? (
        <Image source={{ uri: invitee.photoUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{invitee.name || 'کاربرِ نودوست'}</Text>
        <Text style={[styles.rowHint, { color: STATUS_COLOR[invitee.status] }]}>
          {STATUS_TEXT[invitee.status]} · {timeAgo(invitee.createdAt)}
        </Text>
      </View>
      {invitee.status === 'qualified' && invitee.inviterPoints > 0 ? (
        <Text style={styles.rowValue}>+{faNum(invitee.inviterPoints)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl * 2, gap: spacing.md },

  codeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  codeLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  codeBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.gold2,
    letterSpacing: 6,
  },
  copyTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  copyTagText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.gold,
    writingDirection: 'rtl',
  },
  codeHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  statsRow: { flexDirection: 'row-reverse', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.gold2 },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    marginTop: 2,
    writingDirection: 'rtl',
  },

  note: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.md },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noteStrong: { fontFamily: fonts.bold, color: colors.gold2 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
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
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  ok: { color: colors.ok },
  bad: { color: colors.rose },

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
    borderTopColor: colors.rim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2 },
  avatarEmpty: { borderWidth: 1, borderColor: colors.line, borderTopColor: colors.rim },
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
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  rowValue: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ok },
});
