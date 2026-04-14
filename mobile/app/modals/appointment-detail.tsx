import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { appointmentsApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

const STATUS_COLORS: Record<string, string> = {
  confirmed: Colors.success, pending: Colors.warning,
  cancelled: Colors.error, completed: '#888',
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'מאושר', pending: 'ממתין', cancelled: 'בוטל', completed: 'הושלם',
};

export default function AppointmentDetailModal() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.get(Number(id)),
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => appointmentsApi.update(Number(id), { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); },
  });

  const apt = data?.data;

  if (isLoading) return (
    <View style={[styles.loading, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={Colors.orange} size="large" />
    </View>
  );

  if (!apt) return null;

  const handleComplete = () => {
    Alert.alert('השלמת תור', 'לסמן תור זה כהושלם?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'כן', onPress: () => updateMutation.mutate('completed') },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('ביטול תור', 'לבטל תור זה?', [
      { text: 'לא', style: 'cancel' },
      { text: 'בטל תור', style: 'destructive', onPress: () => updateMutation.mutate('cancelled') },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Handle */}
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[apt.status]}22` }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[apt.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[apt.status] }]}>
              {STATUS_LABELS[apt.status]}
            </Text>
          </View>
          <Text style={[styles.customerName, { color: colors.text }]}>{apt.customer_name || 'לקוח'}</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {apt.starts_at?.slice(0, 10)} • {apt.starts_at?.slice(11, 16)}–{apt.ends_at?.slice(11, 16)}
          </Text>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow icon="✂️" label="שירות" value={apt.service_name || '-'} colors={colors} />
          <DetailRow icon="💰" label="מחיר" value={`₪${apt.price || 0}`} colors={colors} highlight />
          {apt.staff_name && <DetailRow icon="👤" label="עובד" value={apt.staff_name} colors={colors} />}
          {apt.customer_phone && <DetailRow icon="📱" label="טלפון" value={apt.customer_phone} colors={colors} />}
          {apt.notes && <DetailRow icon="📝" label="הערות" value={apt.notes} colors={colors} />}
        </View>

        {/* Actions */}
        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
          <View style={[styles.actions, { paddingHorizontal: Spacing.lg }]}>
            <TouchableOpacity onPress={handleComplete} activeOpacity={0.8} style={{ flex: 1 }}>
              <LinearGradient colors={[Colors.success, '#16a34a']} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>✓ הושלם</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.cancelBtn, { borderColor: `${Colors.error}40` }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: Colors.error }]}>ביטול תור</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.whatsappBtn, { backgroundColor: `${Colors.success}15`, marginHorizontal: Spacing.lg }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.whatsappText, { color: Colors.success }]}>📱 שלח תזכורת WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, colors, highlight }: any) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: highlight ? Colors.orange : colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  header: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: Font.semiBold, fontSize: 13 },
  customerName: { fontFamily: Font.bold, fontSize: 26, textAlign: 'center' },
  time: { fontFamily: Font.regular, fontSize: 15 },
  detailCard: { marginHorizontal: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  detailIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  detailLabel: { fontFamily: Font.regular, fontSize: 14, flex: 1 },
  detailValue: { fontFamily: Font.semiBold, fontSize: 14, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: { borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  actionBtnText: { fontFamily: Font.bold, fontSize: 16, color: '#fff' },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { fontFamily: Font.semiBold, fontSize: 16 },
  whatsappBtn: { borderRadius: Radius.md, padding: 16, alignItems: 'center', marginBottom: 40 },
  whatsappText: { fontFamily: Font.semiBold, fontSize: 15 },
});
