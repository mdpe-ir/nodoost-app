import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Profile, Tiers, Payments } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { TierBadge, tierName } from '@/components/TierBadge';
import { Button } from '@/components/Button';
import { faPrice } from '@/lib/faNum';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Photo, TierPlan } from '@/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { me, refreshMe, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plans, setPlans] = useState<TierPlan[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(me?.bio ?? '');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPhotos(await Profile.photos());
    } catch {}
    try {
      setPlans(await Tiers.list());
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      await Profile.addPhoto(res.assets[0].uri);
      setPhotos(await Profile.photos());
    } catch {
      Alert.alert('خطا', 'آپلودِ عکس ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(id: number) {
    try {
      await Profile.deletePhoto(id);
      setPhotos(await Profile.photos());
    } catch {}
  }

  async function saveBio() {
    setBusy(true);
    try {
      await Profile.update({ bio: bio.trim() });
      await refreshMe();
      setEditing(false);
    } catch {
      Alert.alert('خطا', 'ذخیره ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function upgrade(plan: TierPlan) {
    try {
      const r = await Payments.zarinpalRequest(plan.id);
      if (r?.pay_url) Linking.openURL(r.pay_url);
    } catch {
      Alert.alert('خطا', 'اتصال به درگاهِ پرداخت ناموفق بود');
    }
  }

  function confirmDelete() {
    Alert.alert('حذفِ حساب', 'مطمئنی؟ این کار قابلِ بازگشت نیست.', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await Profile.remove();
          } catch {}
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  const primary = photos.find((p) => p.is_primary)?.url ?? photos[0]?.url;
  const tier = me?.tier ?? 1;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 }]}
    >
      <View style={styles.hero}>
        {primary ? (
          <Image source={{ uri: primary }} style={styles.heroImg} />
        ) : (
          <View style={[styles.heroImg, styles.heroEmpty]}>
            <Text style={styles.heroInitial}>{(me?.name || '؟').charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.name}>{me?.name || 'کاربر'}</Text>
        <TierBadge tier={tier} />
      </View>

      <Text style={styles.section}>عکس‌ها</Text>
      <View style={styles.grid}>
        {photos.map((p) => (
          <View key={p.id} style={styles.cell}>
            <Image source={{ uri: p.url }} style={styles.cellImg} />
            <Pressable style={styles.del} onPress={() => removePhoto(p.id)}>
              <Text style={styles.delText}>×</Text>
            </Pressable>
          </View>
        ))}
        {photos.length < 6 ? (
          <Pressable style={styles.addCell} onPress={addPhoto} disabled={busy}>
            <Ionicons name="add" size={28} color={colors.gold} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.bioHead}>
        <Text style={styles.section}>درباره‌ی من</Text>
        <Pressable onPress={() => (editing ? saveBio() : setEditing(true))}>
          <Text style={styles.edit}>{editing ? 'ذخیره' : 'ویرایش'}</Text>
        </Pressable>
      </View>
      {editing ? (
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={styles.bioInput}
          multiline
          textAlign="right"
          maxLength={160}
          placeholder="یک جمله درباره‌ی خودت…"
          placeholderTextColor={colors.ink3}
        />
      ) : (
        <Text style={styles.bioText}>{me?.bio || 'هنوز چیزی ننوشته‌ای.'}</Text>
      )}

      <Text style={styles.section}>عضویت</Text>
      <Text style={styles.tierNow}>عضویتِ فعلی: {tierName(tier) || 'نقره‌ای'}</Text>
      <View style={{ gap: 12, marginTop: 6 }}>
        {plans
          .filter((p) => p.level > tier)
          .map((p) => (
            <Pressable key={p.id} style={styles.plan} onPress={() => upgrade(p)}>
              <View>
                <Text style={styles.planName}>{p.name}</Text>
                <Text style={styles.planSub}>ارتقا به سطحِ بالاتر</Text>
              </View>
              <Text style={styles.planPrice}>
                {p.price_toman != null
                  ? faPrice(p.price_toman) + ' تومان'
                  : p.amount_rial != null
                  ? faPrice(Math.round(p.amount_rial / 10)) + ' تومان'
                  : ''}
              </Text>
            </Pressable>
          ))}
      </View>

      <View style={styles.footer}>
        <Button label="خروج از حساب" variant="ghost" onPress={logout} />
        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>حذفِ حساب</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', marginBottom: 10 },
  heroImg: { width: 110, height: 110, borderRadius: 55, marginBottom: 14 },
  heroEmpty: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontFamily: fonts.bold, fontSize: 44, color: colors.goldSoft },
  name: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink, marginBottom: 8 },
  section: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink3, marginTop: 26, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: 96, height: 124, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  cellImg: { width: '100%', height: '100%' },
  del: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11,8,11,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: '#fff', fontSize: 16, lineHeight: 18 },
  addCell: {
    width: 96,
    height: 124,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  edit: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold, marginTop: 26 },
  bioText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink2, lineHeight: 26 },
  bioInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    minHeight: 90,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  tierNow: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: 16,
    padding: 16,
  },
  planName: { fontFamily: fonts.bold, fontSize: 16, color: colors.gold2 },
  planSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: 4 },
  planPrice: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  footer: { marginTop: 34, gap: 14 },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
  deleteText: { fontFamily: fonts.regular, fontSize: 13, color: colors.rose },
});
