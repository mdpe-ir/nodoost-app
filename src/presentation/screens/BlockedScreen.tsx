import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { RowsSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { Button } from '@/presentation/components/Button';
import { ActionSheet } from '@/presentation/components/ActionSheet';
import { useBlockedViewModel } from '@/presentation/hooks/useBlockedViewModel';
import { faDayLabel } from '@/core/utils/time';
import type { BlockedUser } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/**
 * تنظیمات ← حریمِ خصوصی ← کاربرانِ مسدودشده.
 *
 * عمداً روی نام و عکس تپ نمی‌شود: کاربرِ بلاک‌شده پروفایلِ قابلِ دیدن ندارد
 * (سرور ۴۰۴ می‌دهد) و لینک‌دادن به بن‌بست، بدترین نوعِ لینک است.
 */
export function BlockedScreen() {
  const vm = useBlockedViewModel();
  const [confirm, setConfirm] = useState<BlockedUser | null>(null);

  return (
    <ScreenContainer>
      <StackHeader title="کاربرانِ مسدودشده" />

      {vm.loading ? (
        <RowsSkeleton count={6} />
      ) : vm.error && vm.items.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={() => vm.reload()}
          />
        </View>
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.gold} />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar uri={item.photoUrl} name={item.name} size={48} />
              <View style={styles.rowBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name ?? 'بی‌نام'}
                  </Text>
                  {item.verified ? <Icon name="shield-check" size={14} tint="gold" /> : null}
                </View>
                <Text style={styles.since}>{`مسدود از ${faDayLabel(item.blockedAt)}`}</Text>
              </View>
              <Button
                label="رفعِ مسدودی"
                size="sm"
                variant="ghost"
                disabled={vm.busyId === item.id}
                onPress={() => setConfirm(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <EmptyState
                icon="shield-check"
                title="کسی را مسدود نکرده‌ای"
                hint="اگر کسی آزارت داد، از پروفایل یا خودِ گفتگو می‌توانی مسدودش کنی."
              />
            </View>
          }
        />
      )}

      <ActionSheet
        visible={confirm != null}
        title={`رفعِ مسدودیِ ${confirm?.name ?? 'این کاربر'}؟`}
        subtitle="دوباره می‌توانید هم را ببینید و پیام بدهید. دنبال‌کردنِ قبلی برنمی‌گردد — اگر بخواهید، باید از نو دنبال کنید."
        actions={[
          {
            key: 'yes',
            label: 'بله، رفعِ مسدودی',
            icon: 'shield-check',
            onPress: () => {
              if (confirm) void vm.unblock(confirm.id);
              setConfirm(null);
            },
          },
        ]}
        onDismiss={() => setConfirm(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.md, flexGrow: 1 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  rowBody: { flex: 1 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  name: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  since: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
