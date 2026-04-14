import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { appointmentsApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success,
  pending: Colors.warning,
  cancelled: Colors.error,
  completed: '#888',
};

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const DAY_NAMES_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getWeekDays(base: Date) {
  const days = [];
  const dow = base.getDay();
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - dow);
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function CalendarScreen() {
  const { colors } = useThemeStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const weekDays = getWeekDays(weekBase);
  const dateStr = toDateStr(selectedDate);

  const { data, refetch } = useQuery({
    queryKey: ['appointments', dateStr],
    queryFn: () => appointmentsApi.list({ date: dateStr }),
  });

  const appts = data?.data?.appointments || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };

  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date());
  const isSelected = (d: Date) => toDateStr(d) === toDateStr(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>יומן</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/modals/new-appointment')}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.addBtnGrad}>
            <Text style={styles.addBtnText}>+ תור</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Week Navigator */}
      <View style={[styles.weekNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={nextWeek} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <View style={styles.weekDays}>
          {weekDays.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={styles.dayBtn}
              onPress={() => setSelectedDate(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, { color: colors.textMuted }]}>{DAY_NAMES[d.getDay()]}</Text>
              <View style={[
                styles.dayNum,
                isSelected(d) && styles.dayNumSelected,
                isToday(d) && !isSelected(d) && styles.dayNumToday,
              ]}>
                <Text style={[
                  styles.dayNumText,
                  { color: isSelected(d) ? '#fff' : colors.text },
                  isToday(d) && !isSelected(d) && { color: Colors.orange },
                ]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={prevWeek} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={[styles.navArrow, { color: colors.textSecondary }]}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* Selected day label */}
      <View style={styles.dayLabel}>
        <Text style={[styles.dayLabelText, { color: colors.textSecondary }]}>
          {DAY_NAMES_FULL[selectedDate.getDay()]}, {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
        </Text>
        <Text style={[styles.aptCount, { color: colors.textMuted }]}>{appts.length} תורים</Text>
      </View>

      {/* Appointments list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {appts.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>אין תורים ביום זה</Text>
            <TouchableOpacity onPress={() => router.push('/modals/new-appointment')} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>+ הוסף תור</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          appts.map((apt: any) => (
            <TouchableOpacity
              key={apt.id}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/modals/appointment-detail', params: { id: apt.id } })}
            >
              <View style={[styles.aptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.aptBar, { backgroundColor: STATUS_COLORS[apt.status] }]} />
                <View style={styles.aptTime}>
                  <Text style={[styles.aptTimeText, { color: colors.text }]}>{apt.starts_at?.slice(11, 16)}</Text>
                  <Text style={[styles.aptDuration, { color: colors.textMuted }]}>{apt.duration_minutes || 30}ד׳</Text>
                </View>
                <View style={styles.aptDivider} />
                <View style={styles.aptInfo}>
                  <Text style={[styles.aptName, { color: colors.text }]}>{apt.customer_name || 'לקוח'}</Text>
                  <Text style={[styles.aptService, { color: colors.textSecondary }]}>{apt.service_name}</Text>
                  {apt.staff_name && <Text style={[styles.aptStaff, { color: colors.textMuted }]}>עם {apt.staff_name}</Text>}
                </View>
                <View style={styles.aptPrice}>
                  <Text style={[styles.aptPriceText, { color: Colors.orange }]}>₪{apt.price || 0}</Text>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[apt.status] }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: Font.bold, fontSize: 28 },
  addBtn: {},
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full },
  addBtnText: { fontFamily: Font.semiBold, fontSize: 14, color: '#fff' },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  navArrow: { fontSize: 24, fontWeight: 'bold' },
  weekDays: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  dayBtn: { alignItems: 'center', gap: 6 },
  dayName: { fontFamily: Font.regular, fontSize: 11 },
  dayNum: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayNumSelected: { backgroundColor: Colors.orange },
  dayNumToday: { borderWidth: 1.5, borderColor: Colors.orange },
  dayNumText: { fontFamily: Font.semiBold, fontSize: 15 },
  dayLabel: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  dayLabelText: { fontFamily: Font.medium, fontSize: 14 },
  aptCount: { fontFamily: Font.regular, fontSize: 13 },
  list: { padding: Spacing.lg, gap: 10, paddingBottom: 32 },
  empty: {
    borderRadius: Radius.xl, borderWidth: 1, padding: 48,
    alignItems: 'center', gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: Font.medium, fontSize: 16 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, marginTop: 4 },
  emptyBtnText: { fontFamily: Font.semiBold, fontSize: 15, color: '#fff' },
  aptCard: {
    borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
  },
  aptBar: { width: 4, alignSelf: 'stretch', minHeight: 72 },
  aptTime: { paddingHorizontal: 14, alignItems: 'center', minWidth: 54 },
  aptTimeText: { fontFamily: Font.bold, fontSize: 16 },
  aptDuration: { fontFamily: Font.regular, fontSize: 11, marginTop: 3 },
  aptDivider: { width: 1, height: 40, backgroundColor: 'rgba(128,128,128,0.15)' },
  aptInfo: { flex: 1, padding: 14 },
  aptName: { fontFamily: Font.semiBold, fontSize: 15, textAlign: 'right' },
  aptService: { fontFamily: Font.regular, fontSize: 13, marginTop: 3, textAlign: 'right' },
  aptStaff: { fontFamily: Font.regular, fontSize: 12, marginTop: 2, textAlign: 'right' },
  aptPrice: { paddingRight: 14, alignItems: 'flex-end', gap: 8 },
  aptPriceText: { fontFamily: Font.bold, fontSize: 15 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
