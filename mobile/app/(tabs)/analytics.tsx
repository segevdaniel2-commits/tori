import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { analyticsApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.kpiDot, { backgroundColor: `${color}22` }]}>
        <View style={[styles.kpiDotInner, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.kpiSub, { color: color }]}>{sub}</Text>}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useThemeStore();

  const { data } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.summary(),
  });

  const s = data?.data || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(244,63,94,0.12)', 'transparent']}
            style={styles.headerGrad}
          />
          <Text style={[styles.title, { color: colors.text }]}>נתונים</Text>
          <Text style={[styles.period, { color: colors.textMuted }]}>החודש הנוכחי</Text>
        </View>

        {/* Revenue Hero */}
        <View style={[styles.heroSection, { paddingHorizontal: Spacing.lg }]}>
          <LinearGradient
            colors={[Colors.coral, Colors.orange]}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroLabel}>הכנסה החודש</Text>
            <Text style={styles.heroValue}>₪{(s.revenue || 0).toLocaleString()}</Text>
            {s.revenue_change !== undefined && (
              <Text style={styles.heroChange}>
                {s.revenue_change >= 0 ? '↑' : '↓'} {Math.abs(s.revenue_change || 0)}% מהחודש שעבר
              </Text>
            )}
          </LinearGradient>
        </View>

        {/* KPI Grid */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>סיכום</Text>
          <View style={styles.kpiGrid}>
            <KPICard label="תורים" value={s.total_appointments?.toString() || '0'} color={Colors.orange} />
            <KPICard label="הושלמו" value={s.completed?.toString() || '0'} color={Colors.success} />
            <KPICard label="בוטלו" value={s.cancelled?.toString() || '0'} color={Colors.error} />
            <KPICard label="לקוחות חדשים" value={s.new_customers?.toString() || '0'} color={Colors.cyan} />
          </View>
        </View>

        {/* Top Services */}
        {s.top_services?.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>שירותים מובילים</Text>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {s.top_services.map((sv: any, i: number) => (
                <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.listRank, { color: Colors.orange }]}>#{i + 1}</Text>
                  <Text style={[styles.listName, { color: colors.text }]}>{sv.name}</Text>
                  <Text style={[styles.listValue, { color: colors.textSecondary }]}>{sv.count} פעמים</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Customers */}
        {s.top_customers?.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: Spacing.lg, paddingBottom: 32 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>לקוחות מובילים</Text>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {s.top_customers.map((c: any, i: number) => (
                <View key={i} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.listRank, { color: Colors.coral }]}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.listSub, { color: colors.textMuted }]}>{c.total_visits} ביקורים</Text>
                  </View>
                  <Text style={[styles.listValue, { color: Colors.orange }]}>₪{c.spent}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 8, paddingHorizontal: Spacing.lg },
  headerGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  title: { fontFamily: Font.bold, fontSize: 28 },
  period: { fontFamily: Font.regular, fontSize: 14, marginTop: 4 },
  heroSection: { marginTop: Spacing.lg },
  heroCard: { borderRadius: Radius.xl, padding: Spacing.lg },
  heroLabel: { fontFamily: Font.medium, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  heroValue: { fontFamily: Font.extraBold, fontSize: 42, color: '#fff', marginTop: 4 },
  heroChange: { fontFamily: Font.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  section: { marginTop: Spacing.lg },
  sectionTitle: { fontFamily: Font.semiBold, fontSize: 18, marginBottom: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: '45%', borderRadius: Radius.md, borderWidth: 1,
    padding: 16, alignItems: 'center', gap: 4,
  },
  kpiDot: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiDotInner: { width: 12, height: 12, borderRadius: 4 },
  kpiValue: { fontFamily: Font.bold, fontSize: 24 },
  kpiLabel: { fontFamily: Font.regular, fontSize: 12 },
  kpiSub: { fontFamily: Font.medium, fontSize: 11 },
  listCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  listRank: { fontFamily: Font.bold, fontSize: 14, width: 28 },
  listName: { fontFamily: Font.semiBold, fontSize: 14, flex: 1, textAlign: 'right' },
  listSub: { fontFamily: Font.regular, fontSize: 12, textAlign: 'right' },
  listValue: { fontFamily: Font.medium, fontSize: 13 },
});
