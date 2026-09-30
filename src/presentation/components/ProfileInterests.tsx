import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

interface Props {
  /** متنِ معرفی؛ خالی یعنی بخشی نمایش داده نمی‌شود. */
  bio?: string;
  interests: string[];
  /**
   * علاقه‌مندی‌های خودِ بیننده. مشترک‌ها طلایی و جلوتر می‌آیند — نقطه‌ی اتصالِ
   * گفتگو. اگر نیاید، همه‌ی برچسب‌ها خنثی می‌مانند.
   */
  myInterests?: string[];
}

/**
 * «درباره‌اش» + «علاقه‌مندی‌ها» — بخشی که هم در پروفایلِ اجتماعی و هم در
 * اطلاعاتِ مخاطبِ گفتگو دیده می‌شود.
 *
 * چرا جدا شد: همین بیست خط در دو صفحه تکرار می‌شدند و هر تغییرِ ظاهری (فونتِ
 * برچسب، رنگِ اشتراک) باید دو جا اعمال می‌شد. حالا یک منبعِ حقیقت دارد و
 * منطقِ «مشترک‌ها جلوتر» هم فقط این‌جاست.
 */
export function ProfileInterests({ bio, interests, myInterests }: Props) {
  const mine = new Set(myInterests ?? []);
  const shared = interests.filter((l) => mine.has(l));
  const rest = interests.filter((l) => !mine.has(l));

  if (!bio && interests.length === 0) return null;

  return (
    <>
      {bio ? (
        <>
          <Text style={styles.section}>درباره‌اش</Text>
          <Text style={styles.bio}>{bio}</Text>
        </>
      ) : null}

      {interests.length > 0 ? (
        <>
          <Text style={styles.section}>علاقه‌مندی‌ها</Text>
          {shared.length > 0 ? (
            <Text style={styles.sharedNote}>
              {faNum(shared.length)} علاقه‌ی مشترک دارید ✨
            </Text>
          ) : null}
          <View style={styles.interests}>
            {[...shared, ...rest].map((label) => {
              const isShared = mine.has(label);
              return (
                <View key={label} style={[styles.interest, isShared && styles.interestShared]}>
                  <Text style={[styles.interestText, isShared && styles.interestTextShared]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  interests: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  interest: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  interestText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  interestShared: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  interestTextShared: { color: colors.gold2 },
  sharedNote: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
});
