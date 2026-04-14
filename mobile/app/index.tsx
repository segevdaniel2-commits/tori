import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function Index() {
  const { token } = useAuthStore();
  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}
