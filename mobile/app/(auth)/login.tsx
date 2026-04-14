import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, I18nManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

I18nManager.forceRTL(true);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { colors, mode } = useThemeStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא אימייל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('כניסה נכשלה', err?.response?.data?.error || 'בדוק אימייל וסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(249,115,22,0.12)', 'transparent']}
        style={styles.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[Colors.orange, Colors.coral]}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoLetter}>T</Text>
            </LinearGradient>
            <Text style={[styles.logoText, { color: colors.text }]}>Tori</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              ניהול העסק שלך, בקצות האצבעות
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>אימייל</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>סיסמה</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={[Colors.orange, Colors.coral]}
                style={styles.btn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.btnText}>
                  {loading ? 'נכנס...' : 'כניסה'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: colors.textMuted }]}>
                שכחתי סיסמה
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: 56 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoLetter: { fontFamily: Font.extraBold, fontSize: 36, color: '#fff' },
  logoText: { fontFamily: Font.bold, fontSize: 32, marginBottom: 8 },
  tagline: { fontFamily: Font.regular, fontSize: 15, textAlign: 'center' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontFamily: Font.medium, fontSize: 13, textAlign: 'right' },
  input: {
    borderWidth: 1, borderRadius: Radius.md,
    padding: 16, fontSize: 16, fontFamily: Font.regular,
  },
  btnWrap: { marginTop: 8 },
  btn: {
    borderRadius: Radius.md, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontFamily: Font.bold, fontSize: 18, color: '#fff' },
  forgotBtn: { alignItems: 'center', paddingTop: 8 },
  forgotText: { fontFamily: Font.regular, fontSize: 14 },
});
