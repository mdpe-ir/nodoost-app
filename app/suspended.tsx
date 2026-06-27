import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Profile } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Photo } from '@/types';

export default function Suspended() {
  const insets = useSafeAreaInsets();
  const { me, refreshMe, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);

  const banned = me?.status === 'banned';

  const loadPhotos = useCallback(async () => {
    try {
      setPhotos(await Profile.photos());
    } catch {}
  }, []);

  useEffect(() => {
    if (banned) loadPhotos();
  }, [banned, loadPhotos]);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy(true);
    try {
      await Profile.addPhoto(res.assets[0].uri);
      await loadPhotos();
    } catch {
      Alert.alert('خطا', 'آپلودِ عکس ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(id: number) {
    try {
      await Profile.deletePhoto(id);
      await loadPhotos();
    } catch {}
  }

  async function submit() {
    setBusy(true);
    try {
      await Profile.requestReview();
      await refreshMe();
    } catch {
      Alert.alert('خطا', 'ارسالِ درخواست ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>حساب معلق</Text>
      </View>
      <Text style={styles.title}>{banned ? 'حسابت موقتاً معلق شده' : 'درخواستت در حالِ بررسیه'}</Text>

      {me?.ban_reason ? (
        <>
          <Text style={styles.rlabel}>دلیل:</Text>
          <View style={styles.reason}>
            <Text style={styles.reasonText}>{me.ban_reason}</Text>
          </View>
        </>
      ) : null}

      {banned ? (
        <>
          <Text style={styles.hint}>
            عکسِ نامناسب را حذف کن و یک عکسِ واضح و مناسب از چهره‌ات بگذار، بعد برای بازبینی بفرست.
          </Text>
          <View style={styles.grid}>
            {photos.map((p) => (
              <View key={p.id} style={styles.cell}>
                <Image source={{ uri: p.url }} style={styles.cellImg} />
                <Pressable style={styles.del} onPress={() => removePhoto(p.id)}>
                  <Text style={styles.delText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
          <Pressable style={styles.add} onPress={addPhoto} disabled={busy}>
            <Text style={styles.addText}>+ افزودنِ عکسِ تازه</Text>
          </Pressable>
          <Button label="ارسال برای بازبینی" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
        </>
      ) : (
        <Text style={styles.hint}>
          درخواستت ثبت شد و در حالِ بررسیه. وقتی تأیید شود، حسابت دوباره فعال می‌شود.
        </Text>
      )}

      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>خروج از حساب</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 28, backgroundColor: colors.bg, flexGrow: 1, alignItems: 'center' },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 50,
    backgroundColor: colors.roseFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,111,128,0.3)',
    marginBottom: 12,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 11, color: colors.rose },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.ink, textAlign: 'center' },
  rlabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: 18 },
  reason: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 18,
  },
  reasonText: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, lineHeight: 26, textAlign: 'center' },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink2, lineHeight: 24, textAlign: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 12 },
  cell: { width: 84, height: 108, borderRadius: 14, overflow: 'hidden', position: 'relative' },
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
  add: {
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addText: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold },
  logout: { marginTop: 22 },
  logoutText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink3, textDecorationLine: 'underline' },
});
