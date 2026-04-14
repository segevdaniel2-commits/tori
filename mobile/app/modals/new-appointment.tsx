import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/theme';
import { appointmentsApi, customersApi, servicesApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

const HOURS = Array.from({ length: 24 }, (_, h) =>
  [0, 15, 30, 45].map(m => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
).flat().filter(t => t >= '07:00' && t <= '22:00');

export default function NewAppointmentModal() {
  const { colors } = useThemeStore();
  const qc = useQueryClient();

  const [step, setStep] = useState<'customer' | 'service' | 'datetime' | 'confirm'>('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('10:00');

  const { data: custData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  const { data: svcData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  });

  const customers = (custData?.data?.customers || []).filter((c: any) =>
    !customerSearch || c.name?.includes(customerSearch) || c.whatsapp_phone?.includes(customerSearch)
  );
  const services = svcData?.data?.services || [];

  const mutation = useMutation({
    mutationFn: () => {
      const starts = `${selectedDate}T${selectedTime}:00`;
      const dur = selectedService?.duration_minutes || 30;
      const ends = new Date(new Date(starts).getTime() + dur * 60000).toISOString().slice(0, 16) + ':00';
      return appointmentsApi.create({
        customer_id: selectedCustomer.id,
        service_id: selectedService.id,
        starts_at: starts,
        ends_at: ends,
        price: selectedService.price,
        status: 'confirmed',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      Alert.alert('', 'התור נקבע בהצלחה ✓', [{ text: 'אישור', onPress: () => router.back() }]);
    },
    onError: () => Alert.alert('שגיאה', 'לא ניתן לקבוע תור. נסה שוב.'),
  });

  const stepTitles = { customer: 'בחר לקוח', service: 'בחר שירות', datetime: 'תאריך ושעה', confirm: 'אישור' };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>ביטול</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{stepTitles[step]}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Step indicators */}
      <View style={styles.steps}>
        {(['customer', 'service', 'datetime', 'confirm'] as const).map((s, i) => (
          <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive, { backgroundColor: step === s ? Colors.orange : colors.border }]} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Step 1: Customer */}
        {step === 'customer' && (
          <View style={{ gap: 12 }}>
            <TextInput
              style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={customerSearch}
              onChangeText={setCustomerSearch}
              placeholder="חיפוש לקוח..."
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
            {customers.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.optCard, { backgroundColor: colors.card, borderColor: selectedCustomer?.id === c.id ? Colors.orange : colors.border }]}
                onPress={() => { setSelectedCustomer(c); setStep('service'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.optSub, { color: colors.textSecondary }]}>{c.whatsapp_phone}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Service */}
        {step === 'service' && (
          <View style={{ gap: 10 }}>
            {services.map((s: any) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.optCard, { backgroundColor: colors.card, borderColor: selectedService?.id === s.id ? Colors.orange : colors.border }]}
                onPress={() => { setSelectedService(s); setStep('datetime'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optName, { color: colors.text }]}>{s.name}</Text>
                <Text style={[styles.optSub, { color: colors.textSecondary }]}>{s.duration_minutes} דק׳ • ₪{s.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Date & Time */}
        {step === 'datetime' && (
          <View style={{ gap: 16 }}>
            <TextInput
              style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>בחר שעה</Text>
            <View style={styles.timeGrid}>
              {HOURS.filter((_, i) => i % 2 === 0).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeBtn, { backgroundColor: selectedTime === t ? Colors.orange : colors.card, borderColor: selectedTime === t ? Colors.orange : colors.border }]}
                  onPress={() => setSelectedTime(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeText, { color: selectedTime === t ? '#fff' : colors.text }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setStep('confirm')} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>המשך</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <View style={{ gap: 14 }}>
            <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ConfirmRow icon="👤" label="לקוח" value={selectedCustomer?.name} colors={colors} />
              <ConfirmRow icon="✂️" label="שירות" value={selectedService?.name} colors={colors} />
              <ConfirmRow icon="💰" label="מחיר" value={`₪${selectedService?.price}`} colors={colors} highlight />
              <ConfirmRow icon="📅" label="תאריך" value={selectedDate} colors={colors} />
              <ConfirmRow icon="🕐" label="שעה" value={selectedTime} colors={colors} />
            </View>

            <TouchableOpacity onPress={() => mutation.mutate()} disabled={mutation.isPending} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.nextBtn}>
                {mutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.nextBtnText}>✓ קבע תור</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ConfirmRow({ icon, label, value, colors, highlight }: any) {
  return (
    <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
      <Text style={styles.confirmIcon}>{icon}</Text>
      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.confirmValue, { color: highlight ? Colors.orange : colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: 16, borderBottomWidth: 1 },
  cancelText: { fontFamily: Font.medium, fontSize: 15, width: 48 },
  title: { fontFamily: Font.bold, fontSize: 17 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepDotActive: { width: 24 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  search: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: Font.regular },
  optCard: { borderWidth: 1, borderRadius: Radius.md, padding: 16 },
  optName: { fontFamily: Font.semiBold, fontSize: 15, textAlign: 'right' },
  optSub: { fontFamily: Font.regular, fontSize: 13, marginTop: 4, textAlign: 'right' },
  subLabel: { fontFamily: Font.medium, fontSize: 14, textAlign: 'right' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1 },
  timeText: { fontFamily: Font.medium, fontSize: 14 },
  nextBtn: { borderRadius: Radius.md, paddingVertical: 18, alignItems: 'center' },
  nextBtnText: { fontFamily: Font.bold, fontSize: 17, color: '#fff' },
  confirmCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  confirmIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  confirmLabel: { fontFamily: Font.regular, fontSize: 14, flex: 1 },
  confirmValue: { fontFamily: Font.semiBold, fontSize: 14 },
});
