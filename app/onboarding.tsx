import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Profile } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const GENDERS = [
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { refreshMe } = useAuth();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    if (name.trim().length < 2) {
      setError('اسمت را وارد کن');
      return;
    }
    if (!gender) {
      setError('جنسیتت را انتخاب کن');
      return;
    }
    setLoading(true);
    try {
      await Profile.update({ name: name.trim(), gender, bio: bio.trim() });
      await refreshMe();
      router.replace('/(tabs)/discover');
    } catch {
      setError('ذخیره ناموفق بود. دوباره امتحان کن.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>بذار آشنا شیم</Text>
      <Text style={styles.sub}>چند قدمِ کوتاه تا پروفایلت آماده شود.</Text>

      <Text style={styles.label}>اسمت</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="مثلاً نیلوفر"
        placeholderTextColor={colors.ink3}
        style={styles.input}
        textAlign="right"
      />

      <Text style={styles.label}>جنسیت</Text>
      <View style={styles.row}>
        {GENDERS.map((g) => {
          const on = gender === g.key;
          return (
            <Pressable
              key={g.key}
              onPress={() => setGender(g.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>درباره‌ات (اختیاری)</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="یک جمله درباره‌ی خودت بنویس…"
        placeholderTextColor={colors.ink3}
        style={[styles.input, styles.bio]}
        textAlign="right"
        multiline
        maxLength={160}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="ادامه" onPress={save} loading={loading} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 26, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginTop: 8, marginBottom: 26 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2, marginBottom: 10, marginTop: 18 },
  input: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  bio: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  chip: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  chipText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink2 },
  chipTextOn: { color: colors.gold2 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.rose, marginTop: 14 },
});
