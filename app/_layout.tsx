
import { Platform, SafeAreaView } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { commonStyles } from '../styles/commonStyles';
import { setupErrorLogging } from '../utils/errorLogger';
import { useAuth } from '../hooks/useAuth';
import AuthScreen from '../components/AuthScreen';
import LoadingSpinner from '../components/LoadingSpinner';

const STORAGE_KEY = 'natively_emulate_mobile';

function RootLayout() {
  const [emulate, setEmulate] = useState(false);
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const globalParams = useGlobalSearchParams();

  useEffect(() => {
    setupErrorLogging();
    
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEmulate(stored === 'true');
    }
  }, []);

  useEffect(() => {
    if (globalParams.emulate === 'true') {
      setEmulate(true);
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } else if (globalParams.emulate === 'false') {
      setEmulate(false);
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, 'false');
      }
    }
  }, [globalParams.emulate]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[commonStyles.container, { paddingTop: insets.top }]}>
          <LoadingSpinner message="Loading..." />
          <StatusBar style="auto" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Show auth screen if no user (but allow anonymous usage)
  // For now, we'll skip the auth screen and allow anonymous usage by default
  // Users can still sign in through the app if they want sync features

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[commonStyles.container, { paddingTop: insets.top }]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="lists" />
          <Stack.Screen name="list/[id]" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default RootLayout;
