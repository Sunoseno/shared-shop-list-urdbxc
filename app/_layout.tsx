
import { Platform, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { commonStyles } from '../styles/commonStyles';
import { setupErrorLogging } from '../utils/errorLogger';
import ErrorBoundary from '../components/ErrorBoundary';

const STORAGE_KEY = 'natively_emulate_mobile';

function RootLayoutContent() {
  const insets = useSafeAreaInsets();
  
  console.log('RootLayoutContent: Rendering with insets:', insets);

  return (
    <View style={[commonStyles.wrapper, { paddingTop: insets.top }]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="lists" />
        <Stack.Screen name="list/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}

function RootLayout() {
  const [emulate, setEmulate] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const globalParams = useGlobalSearchParams();

  useEffect(() => {
    console.log('RootLayout: Setting up error logging');
    setupErrorLogging();
    
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEmulate(stored === 'true');
    }
    
    // Simple initialization - just set ready immediately
    console.log('RootLayout: App is ready');
    setIsReady(true);
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

  if (!isReady) {
    console.log('RootLayout: App not ready yet');
    return null;
  }

  console.log('RootLayout: Rendering main app');

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootLayoutContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default RootLayout;
