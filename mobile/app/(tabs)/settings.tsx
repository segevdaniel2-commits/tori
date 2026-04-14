import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { useAuthStore } from '../../store/auth';
import { businessApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';
import { useState } from 'react';

function SettingRow({ icon, label, value, onPress, danger = false, rightElement }: any) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowLabel, { color: danger ? Colors.error : colors.text }]}>{label}</Text>
      </View>
      {rightElement || (
        <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useThemeStore();
  const { business, logout } = useAuthStore();
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifyCancel, setNotifyCancel] = useState(true);
  const [notifyAI, setNotifyAI] = useState(false);

  const { data } = useQuery({
    queryKey: ['business'],
    queryFn: () => businessApi.get(),
  });

  const biz = data?.data || business || {};

  const handleLogout = () => {
    Alert.alert('יציאה', 'האם אתה בטוח שרוצה לצאת?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'יציאה', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <LinearGradient colors={['rgba(249,115,22,0.12)', 'transparent']} style={styles.headerGrad} />
          <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.bizAvatar}>
            <Text style={styles.bizAvatarText}>{(biz.name || 'T').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={[styles.bizName, { color: colors.text }]}>{biz.name || 'העסק שלי'}</Text>
          <Text style={[styles.bizType, { color: colors.textSecondary }]}>{biz.type || ''}</Text>
          <View style={[styles.planBadge, { backgroundColor: `${Colors.orange}22` }]}>
            <Text style={[styles.planText, { color: Colors.orange }]}>
              {biz.plan === 'pro' ? '⭐ Pro' : biz.plan === 'enterprise' ? '💎 Enterprise' : '🌱 Free'}
            </Text>
          </View>
        </View>

        {/* Business */}
        <Section title="עסק">
          <SettingRow icon="🏪" label="פרטי העסק" value={biz.name} onPress={() => {}} />
          <SettingRow icon="🕐" label="שעות פעילות" onPress={() => {}} />
          <SettingRow icon="✂️" label="שירותים" onPress={() => {}} />
          <SettingRow icon="👤" label="צוות" onPress={() => {}} />
        </Section>

        {/* Notifications */}
        <Section title="התראות">
          <SettingRow
            icon="🔔" label="תור חדש"
            rightElement={<Switch value={notifyNew} onValueChange={setNotifyNew} trackColor={{ true: Colors.orange }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="❌" label="ביטול תור"
            rightElement={<Switch value={notifyCancel} onValueChange={setNotifyCancel} trackColor={{ true: Colors.orange }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="✦" label="פעולות AI"
            rightElement={<Switch value={notifyAI} onValueChange={setNotifyAI} trackColor={{ true: Colors.orange }} thumbColor="#fff" />}
          />
        </Section>

        {/* AI */}
        <Section title="סוכן AI">
          <SettingRow icon="✦" label="דבר עם הסוכן" onPress={() => router.push('/modals/ai-agent')} />
          <SettingRow icon="📊" label="היסטוריית פעולות" onPress={() => {}} />
        </Section>

        {/* Account */}
        <Section title="חשבון">
          <SettingRow icon="📧" label="אימייל" value={biz.email} onPress={() => {}} />
          <SettingRow icon="🔒" label="שינוי סיסמה" onPress={() => {}} />
          <SettingRow icon="💳" label="מנוי ותשלומים" onPress={() => {}} />
        </Section>

        {/* Logout */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, paddingBottom: 40 }]}>
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: `${Colors.error}40` }]} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={[styles.logoutText, { color: Colors.error }]}>יציאה מהחשבון</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', gap: 8 },
  headerGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  bizAvatar: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bizAvatarText: { fontFamily: Font.extraBold, fontSize: 32, color: '#fff' },
  bizName: { fontFamily: Font.bold, fontSize: 22 },
  bizType: { fontFamily: Font.regular, fontSize: 14 },
  planBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full, marginTop: 4 },
  planText: { fontFamily: Font.semiBold, fontSize: 13 },
  section: { marginBottom: 4 },
  sectionTitle: {
    fontFamily: Font.medium, fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  sectionCard: { marginHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { fontFamily: Font.medium, fontSize: 15 },
  rowValue: { fontFamily: Font.regular, fontSize: 14 },
  logoutBtn: { borderWidth: 1, borderRadius: Radius.md, padding: 16, alignItems: 'center' },
  logoutText: { fontFamily: Font.semiBold, fontSize: 16 },
});
