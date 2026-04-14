import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

export default function RootLayout() {
  const { loadFromStorage, isLoading, token } = useAuthStore();
  const { update, mode } = useThemeStore();

  const [fontsLoaded] = useFonts({
    Heebo_300Light, Heebo_400Regular, Heebo_500Medium,
    Heebo_600SemiBold, Heebo_700Bold, Heebo_800ExtraBold,
  });

  useEffect(() => {
    loadFromStorage();
    update();
    const interval = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08080F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modals/ai-agent" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/new-appointment" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/appointment-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/customer-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
