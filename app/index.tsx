
import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { commonStyles } from '../styles/commonStyles';
import AuthScreen from '../components/AuthScreen';
import LoadingSpinner from '../components/LoadingSpinner';

export default function IndexScreen() {
  const { user, loading, session } = useAuth();

  console.log('IndexScreen: Auth state - loading:', loading, 'user:', user?.email, 'session:', !!session);

  if (loading) {
    return (
      <View style={[commonStyles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
      </View>
    );
  }

  // If user is authenticated or chose anonymous mode, redirect to lists
  if (user || session) {
    console.log('IndexScreen: Redirecting to lists - authenticated user');
    return <Redirect href="/lists" />;
  }

  // Show auth screen for new users
  console.log('IndexScreen: Showing auth screen');
  return <AuthScreen />;
}
