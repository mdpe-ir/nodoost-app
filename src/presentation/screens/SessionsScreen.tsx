import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { useCases } from '@/core/di/DIProvider';
import type { AuthSession } from '@/domain/entities';
import { faClock, faJalali } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, radius, spacing } from '@/core/theme';

const PLATFORM_LABELS: Record<string, string> = {
    android: 'اندروید',
    ios: 'iOS',
    web: 'وب',
};

export function SessionsScreen() {
    const uc = useCases();
    const [sessions, setSessions] = useState<AuthSession[]>([]);
    const [currentSid, setCurrentSid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [revokingSid, setRevokingSid] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [notice, setNotice] = useState(false);

    const fetchSessions = useCallback(async () => {
        const [active, current] = await Promise.all([
            uc.auth.listSessions(),
            uc.auth.getCurrentSessionId(),
        ]);
        return { active, current };
    }, [uc]);

    useEffect(() => {
        let alive = true;
        fetchSessions()
            .then(({ active, current }) => {
                if (!alive) return;
                setSessions(active);
                setCurrentSid(current);
                setError(false);
            })
            .catch(() => {
                if (alive) setError(true);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [fetchSessions]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            const { active, current } = await fetchSessions();
            setSessions(active);
            setCurrentSid(current);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setRefreshing(false);
        }
    };

    const revoke = async (sid: string) => {
        setRevokingSid(sid);
        setNotice(false);
        try {
            await uc.auth.revokeSession(sid);
            setSessions((items) => items.filter((item) => item.sid !== sid));
            setNotice(true);
        } catch {
            setError(true);
        } finally {
            setRevokingSid(null);
        }
    };

    const confirmRevoke = (session: AuthSession) => {
        const label = PLATFORM_LABELS[session.platform] ?? session.platform;
        Alert.alert(
            'بستنِ نشست؟',
            `دسترسیِ این دستگاه (${label}) در درخواستِ بعدی قطع می‌شود.`,
            [
                { text: 'انصراف', style: 'cancel' },
                { text: 'بستن نشست', style: 'destructive', onPress: () => void revoke(session.sid) },
            ]
        );
    };

    return (
        <ScreenContainer>
            <StackHeader title="دستگاه‌های متصل" />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={colors.gold}
                        colors={[colors.gold]}
                    />
                }
            >
                <Text style={styles.lead}>
                    نشست‌های فعالِ حساب را ببین. با بستنِ یک نشست، آن دستگاه در درخواستِ بعدی از حساب خارج می‌شود.
                </Text>

                {error ? (
                    <View style={styles.messageBox}>
                        <Text style={styles.messageText}>دریافت یا بستنِ نشست ناموفق بود. دوباره تلاش کن.</Text>
                        <Button label="تلاش دوباره" size="sm" variant="outline" onPress={() => void refresh()} />
                    </View>
                ) : null}

                {notice ? (
                    <View style={[styles.messageBox, styles.successBox]}>
                        <Text style={[styles.messageText, styles.successText]}>نشست بسته شد.</Text>
                    </View>
                ) : null}

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.gold} />
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.empty}>
                        <Icon name="phone" size={22} tint="muted" />
                        <Text style={styles.emptyText}>نشستِ فعالی پیدا نشد.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {sessions.map((session) => {
                            const current = session.sid === currentSid;
                            const platform = (PLATFORM_LABELS[session.platform] ?? session.platform) || 'دستگاه';
                            return (
                                <View key={session.sid} style={styles.row}>
                                    <View style={styles.rowHead}>
                                        <View style={styles.deviceIcon}>
                                            <Icon name="phone" size={18} tint="gold" />
                                        </View>
                                        <View style={styles.deviceInfo}>
                                            <Text style={styles.deviceName}>
                                                {current ? 'این دستگاه' : platform}
                                            </Text>
                                            <Text style={styles.deviceDetail}>
                                                {session.deviceLabel || platform}
                                            </Text>
                                        </View>
                                        {current ? <Text style={styles.currentBadge}>فعلی</Text> : null}
                                    </View>
                                    <View style={styles.times}>
                                        <Text style={styles.timeText}>ورود: {faJalali(session.createdAt)}، {faClock(session.createdAt)}</Text>
                                        <Text style={styles.timeText}>آخرین فعالیت: {faJalali(session.lastSeenAt)}، {faClock(session.lastSeenAt)}</Text>
                                    </View>
                                    {!current ? (
                                        <Button
                                            label={revokingSid === session.sid ? 'در حال بستن…' : 'بستن نشست'}
                                            icon="close"
                                            variant="danger"
                                            size="sm"
                                            disabled={revokingSid !== null}
                                            loading={revokingSid === session.sid}
                                            onPress={() => confirmRevoke(session)}
                                            style={styles.revokeButton}
                                        />
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}

                <Text style={styles.footer}>
                    نشستِ همین دستگاه از این فهرست بسته نمی‌شود؛ برای خروج از آن، از حساب خارج شو.
                </Text>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: spacing.xxl * 2 },
    lead: {
        marginBottom: spacing.lg,
        color: colors.ink2,
        fontFamily: fonts.regular,
        fontSize: fontSizes.sm,
        lineHeight: lineHeights.sm,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    list: { gap: spacing.md },
    row: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
    },
    rowHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
    deviceIcon: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.sm,
        backgroundColor: colors.goldFaint,
    },
    deviceInfo: { flex: 1, alignItems: 'flex-end' },
    deviceName: {
        color: colors.ink,
        fontFamily: fonts.bold,
        fontSize: fontSizes.md,
        textAlign: 'right',
    },
    deviceDetail: {
        marginTop: 2,
        color: colors.ink3,
        fontFamily: fonts.regular,
        fontSize: fontSizes.xs,
        textAlign: 'right',
    },
    currentBadge: {
        overflow: 'hidden',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
        backgroundColor: colors.goldFaint,
        color: colors.gold2,
        fontFamily: fonts.medium,
        fontSize: fontSizes.xs,
    },
    times: { gap: spacing.xs, marginTop: spacing.md },
    timeText: {
        color: colors.ink3,
        fontFamily: fonts.regular,
        fontSize: fontSizes.xs,
        textAlign: 'right',
    },
    revokeButton: { alignSelf: 'flex-start', marginTop: spacing.md },
    center: { paddingVertical: spacing.xxl },
    empty: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xxl,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
    },
    emptyText: {
        color: colors.ink3,
        fontFamily: fonts.regular,
        fontSize: fontSizes.sm,
    },
    messageBox: {
        alignItems: 'flex-end',
        gap: spacing.sm,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.rose,
        borderRadius: radius.md,
        backgroundColor: colors.roseFaint,
    },
    messageText: {
        color: colors.rose,
        fontFamily: fonts.medium,
        fontSize: fontSizes.sm,
        textAlign: 'right',
    },
    successBox: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
    successText: { color: colors.gold2 },
    footer: {
        marginTop: spacing.lg,
        color: colors.ink3,
        fontFamily: fonts.regular,
        fontSize: fontSizes.xs,
        lineHeight: lineHeights.xs,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});