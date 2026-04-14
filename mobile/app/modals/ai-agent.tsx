import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../../store/theme';
import { ownerBotApi } from '../../services/api';
import { Colors, Font, Radius, Spacing } from '../../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const QUICK_PROMPTS = [
  'כמה תורים יש היום?',
  'מה ההכנסה החודש?',
  'מי הלקוח הכי נאמן?',
  'תורים מחר',
  'בטל תור',
  'שלח תזכורות',
];

export default function AIAgentModal() {
  const { colors } = useThemeStore();
  const { prompt: initialPrompt } = useLocalSearchParams<{ prompt?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'שלום! אני הסוכן AI שלך. אני יכול לנהל תורים, לשלוח הודעות ללקוחות, לעדכן פרטים ועוד. במה אוכל לעזור?',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (initialPrompt) {
      setTimeout(() => sendMessage(initialPrompt), 300);
    }
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await ownerBotApi.chat(msg, history);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        ts: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה. נסה שוב.',
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.role === 'assistant';
    return (
      <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
        {isBot && (
          <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>✦</Text>
          </LinearGradient>
        )}
        <View style={[
          styles.bubble,
          isBot
            ? [styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border }]
            : styles.bubbleUser,
        ]}>
          <Text style={[styles.bubbleText, { color: isBot ? colors.text : '#fff' }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>סגור</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.headerIcon}>
            <Text style={{ fontSize: 16, color: '#fff' }}>✦</Text>
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>סוכן AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.onlineText, { color: colors.textMuted }]}>פעיל 24/7</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? (
            <View style={styles.loadingRow}>
              <LinearGradient colors={[Colors.orange, Colors.coral]} style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>✦</Text>
              </LinearGradient>
              <View style={[styles.bubble, styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator color={Colors.orange} size="small" />
              </View>
            </View>
          ) : null}
        />

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.quickChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => sendMessage(q)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, { color: colors.textSecondary }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="שאל אותי כל שאלה..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={input.trim() ? [Colors.orange, Colors.coral] : ['#333', '#333']}
              style={styles.sendBtn}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 48 },
  closeText: { fontFamily: Font.medium, fontSize: 15 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Font.bold, fontSize: 16 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontFamily: Font.regular, fontSize: 12 },
  messageList: { padding: Spacing.lg, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-start', flexDirection: 'row-reverse' },
  botAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  botAvatarText: { fontSize: 14, color: '#fff' },
  bubble: { maxWidth: '78%', borderRadius: Radius.lg, padding: 14, borderWidth: 1 },
  bubbleBot: { borderBottomRightRadius: 4 },
  bubbleUser: {
    backgroundColor: Colors.orange, borderColor: 'transparent',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, textAlign: 'right' },
  loadingRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: 12 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  quickChipText: { fontFamily: Font.medium, fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: Font.regular,
    maxHeight: 100, minHeight: 48,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
});
