import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { useAuthStore } from '../../store/auth';
import { appointmentsApi, analyticsApi } from '../../services/api';
import { Colors, Font, Radius, Spacing, Shadow } from '../../constants/theme';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success,
  pending: Colors.warning,
  cancelled: Colors.error,
  completed: '#888',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'מאושר',
  pending: 'ממתין',
  cancelled: 'בוטל',
  completed: 'הושלם',
};

function formatTime(iso: string) {
  return iso?.slice(11, 16) || '';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function getTodayHebrew() {
  return new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const { colors } = useThemeStore();
  const { business } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: appts, refetch: refetchAppts } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsApi.list({ date: today }),
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.summary(),
  });

  const todayAppts = appts?.data?.appointments || [];
  const stats = analytics?.data || {};

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAppts(), refetchAnalytics()]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(249,115,22,0.15)', 'transparent']}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.bizName, { color: colors.text }]}>
                {business?.name || 'העסק שלי'}
              </Text>
              <Text style={[styles.date, { color: colors.textMuted }]}>{getTodayHebrew()}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.orange, Colors.coral]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {(business?.name || 'T').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 12 }}>
          <StatCard label="תורים היום" value={todayAppts.length} color={Colors.orange} />
          <StatCard label="הכנסה החודש" value={`₪${(stats.revenue || 0).toLocaleString()}`} color={Colors.coral} />
          <StatCard label="לקוחות" value={stats.total_customers || 0} color={Colors.cyan} />
          <StatCard label="השלמה" value={`${stats.completion_rate || 0}%`} color={Colors.success} />
        </ScrollView>

        {/* AI Agent Card */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/modals/ai-agent')}
          >
            <LinearGradient
              colors={['#1a0a2e', '#0d0d20']}
              style={[styles.aiCard, Shadow.lg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={['rgba(249,115,22,0.3)', 'rgba(244,63,94,0.3)']}
                style={styles.aiGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.aiContent}>
                <View style={styles.aiIconWrap}>
                  <LinearGradient
                    colors={[Colors.orange, Colors.coral]}
                    style={styles.aiIcon}
                  >
                    <Text style={styles.aiIconText}>✦</Text>
                  </LinearGradient>
                  <View style={styles.aiPulse} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiTitle}>סוכן AI</Text>
                  <Text style={styles.aiSubtitle}>
                    דבר איתי כדי לנהל תורים, לקוחות ועוד
                  </Text>
                </View>
                <Text style={styles.aiArrow}>←</Text>
              </View>
              <View style={styles.aiChips}>
                {['מה יש היום?', 'בטל תור', 'שלח תזכורות'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.aiChip}
                    onPress={() => router.push({ pathname: '/modals/ai-agent', params: { prompt: chip } })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.aiChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Today's Appointments */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>תורים היום</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')} activeOpacity={0.7}>
              <Text style={[styles.seeAll, { color: Colors.orange }]}>כל היומן</Text>
            </TouchableOpacity>
          </View>

          {todayAppts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>☀️</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>אין תורים היום</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {todayAppts.map((apt: any) => (
                <TouchableOpacity
                  key={apt.id}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/modals/appointment-detail', params: { id: apt.id } })}
                >
                  <View style={[styles.aptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.aptTimeline, { backgroundColor: STATUS_COLORS[apt.status] || Colors.orange }]} />
                    <View style={styles.aptInfo}>
                      <Text style={[styles.aptName, { color: colors.text }]}>
                        {apt.customer_name || 'לקוח'}
                      </Text>
                      <Text style={[styles.aptService, { color: colors.textSecondary }]}>
                        {apt.service_name || '-'}
                      </Text>
                    </View>
                    <View style={styles.aptRight}>
                      <Text style={[styles.aptTime, { color: colors.text }]}>
                        {formatTime(apt.starts_at)}
                      </Text>
                      <View style={[styles.aptStatus, { backgroundColor: `${STATUS_COLORS[apt.status]}20` }]}>
                        <Text style={[styles.aptStatusText, { color: STATUS_COLORS[apt.status] }]}>
                          {STATUS_LABELS[apt.status]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg, paddingBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>פעולות מהירות</Text>
          <View style={styles.quickGrid}>
            <QuickAction icon="+" label="תור חדש" onPress={() => router.push('/modals/new-appointment')} />
            <QuickAction icon="👥" label="לקוח חדש" onPress={() => router.push('/(tabs)/customers')} />
            <QuickAction icon="📊" label="נתונים" onPress={() => router.push('/(tabs)/analytics')} />
            <QuickAction icon="⚙️" label="הגדרות" onPress={() => router.push('/(tabs)/settings')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useThemeStore();
  return (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 8 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: Spacing.lg,
  },
  greeting: { fontFamily: Font.regular, fontSize: 14, textAlign: 'right' },
  bizName: { fontFamily: Font.bold, fontSize: 26, textAlign: 'right', marginTop: 2 },
  date: { fontFamily: Font.regular, fontSize: 13, textAlign: 'right', marginTop: 4 },
  avatarBtn: {},
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.bold, fontSize: 20, color: '#fff' },
  statsRow: { marginTop: Spacing.lg, marginBottom: 4 },
  statCard: {
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, minWidth: 110, alignItems: 'center',
  },
  statValue: { fontFamily: Font.bold, fontSize: 22, textAlign: 'center' },
  statLabel: { fontFamily: Font.regular, fontSize: 12, marginTop: 4, textAlign: 'center' },
  section: { marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: Font.semiBold, fontSize: 18 },
  seeAll: { fontFamily: Font.medium, fontSize: 13 },
  aiCard: { borderRadius: Radius.xl, padding: Spacing.lg, overflow: 'hidden' },
  aiGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80 },
  aiContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIconWrap: { position: 'relative' },
  aiIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aiIconText: { fontSize: 22, color: '#fff' },
  aiPulse: {
    position: 'absolute', top: -3, right: -3, width: 12, height: 12,
    borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#1a0a2e',
  },
  aiTitle: { fontFamily: Font.bold, fontSize: 17, color: '#fff' },
  aiSubtitle: { fontFamily: Font.regular, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  aiArrow: { fontSize: 20, color: 'rgba(255,255,255,0.4)' },
  aiChips: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  aiChip: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  aiChipText: { fontFamily: Font.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  emptyCard: {
    borderRadius: Radius.lg, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 8,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontFamily: Font.medium, fontSize: 15 },
  aptCard: {
    borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
  },
  aptTimeline: { width: 4, alignSelf: 'stretch', minHeight: 64 },
  aptInfo: { flex: 1, padding: 14 },
  aptName: { fontFamily: Font.semiBold, fontSize: 15, textAlign: 'right' },
  aptService: { fontFamily: Font.regular, fontSize: 13, marginTop: 3, textAlign: 'right' },
  aptRight: { paddingRight: 14, alignItems: 'flex-end', gap: 6 },
  aptTime: { fontFamily: Font.bold, fontSize: 16 },
  aptStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  aptStatusText: { fontFamily: Font.medium, fontSize: 11 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    flex: 1, minWidth: '45%', borderRadius: Radius.md, borderWidth: 1,
    padding: 16, alignItems: 'center', gap: 8,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontFamily: Font.medium, fontSize: 13 },
});
