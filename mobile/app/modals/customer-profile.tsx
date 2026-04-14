import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { customersApi, appointmentsApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

const AVATAR_COLORS = [Colors.orange, Colors.coral, Colors.cyan, Colors.success, '#8b5cf6'];

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success, pending: Colors.warning,
  cancelled: Colors.error, completed: '#888',
};

export default function CustomerProfileModal() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: custData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(Number(id)),
  });

  const { data: apptData } = useQuery({
    queryKey: ['customer-appointments', id],
    queryFn: () => appointmentsApi.list({ customer_id: id }),
  });

  const c = custData?.data;
  const appts = apptData?.data?.appointments || [];
  const avatarColor = AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

  if (isLoading) return (
    <View style={[styles.loading, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={Colors.orange} size="large" />
    </View>
  );
  if (!c) return null;

  const totalSpent = appts.filter((a: any) => a.status === 'completed').reduce((s: number, a: any) => s + (a.price || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{(c.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{c.name || 'לא ידוע'}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{c.whatsapp_phone}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="ביקורים" value={c.total_visits || 0} color={Colors.orange} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatItem label="הוצאה" value={`₪${totalSpent.toLocaleString()}`} color={Colors.coral} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatItem label="תורים" value={appts.length} color={Colors.cyan} colors={colors} />
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { paddingHorizontal: Spacing.lg }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/modals/new-appointment')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.newAptBtn}>
              <Text style={styles.newAptBtnText}>+ קבע תור</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.msgBtn, { backgroundColor: `${Colors.success}15` }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.msgBtnText, { color: Colors.success }]}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>היסטוריית תורים</Text>
          {appts.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>אין תורים עדיין</Text>
            </View>
          ) : (
            <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {appts.slice(0, 10).map((a: any, i: number) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.historyRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/modals/appointment-detail', params: { id: a.id } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.historyDot, { backgroundColor: STATUS_COLORS[a.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyService, { color: colors.text }]}>{a.service_name || '-'}</Text>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {a.starts_at?.slice(0, 10)} • {a.starts_at?.slice(11, 16)}
                    </Text>
                  </View>
                  <Text style={[styles.historyPrice, { color: Colors.orange }]}>₪{a.price || 0}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, color, colors }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  profile: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.extraBold, fontSize: 36, color: '#fff' },
  name: { fontFamily: Font.bold, fontSize: 24 },
  phone: { fontFamily: Font.regular, fontSize: 15 },
  statsRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40 },
  statValue: { fontFamily: Font.bold, fontSize: 22 },
  statLabel: { fontFamily: Font.regular, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  newAptBtn: { borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  newAptBtnText: { fontFamily: Font.bold, fontSize: 16, color: '#fff' },
  msgBtn: { flex: 1, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  msgBtnText: { fontFamily: Font.semiBold, fontSize: 15 },
  section: { marginBottom: 8 },
  sectionTitle: { fontFamily: Font.semiBold, fontSize: 18, marginBottom: 12 },
  empty: { borderRadius: Radius.md, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyText: { fontFamily: Font.medium, fontSize: 15 },
  historyCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyService: { fontFamily: Font.semiBold, fontSize: 14, textAlign: 'right' },
  historyDate: { fontFamily: Font.regular, fontSize: 12, textAlign: 'right', marginTop: 2 },
  historyPrice: { fontFamily: Font.bold, fontSize: 14 },
});
