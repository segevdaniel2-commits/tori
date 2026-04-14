import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { customersApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

const AVATAR_COLORS = [Colors.orange, Colors.coral, Colors.cyan, Colors.success, '#8b5cf6'];

export default function CustomersScreen() {
  const { colors } = useThemeStore();
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  const customers = (data?.data?.customers || []).filter((c: any) =>
    !search || c.name?.includes(search) || c.whatsapp_phone?.includes(search)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>לקוחות</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{customers.length}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: Spacing.lg }]}>
        <TextInput
          style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="חיפוש לפי שם או טלפון..."
          placeholderTextColor={colors.textMuted}
          textAlign="right"
        />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(c: any) => c.id?.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: c, index }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/modals/customer-profile', params: { id: c.id } })}
          >
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>
                  {(c.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{c.name || 'לא ידוע'}</Text>
                <Text style={[styles.phone, { color: colors.textSecondary }]}>{c.whatsapp_phone}</Text>
              </View>
              <View style={styles.stats}>
                <Text style={[styles.visits, { color: Colors.orange }]}>{c.total_visits || 0}</Text>
                <Text style={[styles.visitsLabel, { color: colors.textMuted }]}>ביקורים</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'baseline', gap: 10,
  },
  title: { fontFamily: Font.bold, fontSize: 28 },
  count: { fontFamily: Font.regular, fontSize: 16 },
  searchWrap: { marginBottom: 12 },
  search: {
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 16,
    paddingVertical: 13, fontSize: 15, fontFamily: Font.regular,
  },
  list: { paddingHorizontal: Spacing.lg, gap: 10, paddingBottom: 32 },
  card: {
    borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row',
    alignItems: 'center', padding: 14, gap: 14,
  },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.bold, fontSize: 20, color: '#fff' },
  info: { flex: 1 },
  name: { fontFamily: Font.semiBold, fontSize: 15, textAlign: 'right' },
  phone: { fontFamily: Font.regular, fontSize: 13, marginTop: 3, textAlign: 'right' },
  stats: { alignItems: 'center' },
  visits: { fontFamily: Font.bold, fontSize: 20 },
  visitsLabel: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  empty: {
    borderRadius: Radius.xl, borderWidth: 1, margin: 0,
    padding: 48, alignItems: 'center', gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: Font.medium, fontSize: 15 },
});
