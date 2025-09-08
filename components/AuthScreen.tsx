
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInAnonymously, signInWithEmail } = useAuth();

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      console.log('Anonymous sign in successful');
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      Alert.alert('Error', 'Failed to sign in anonymously');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim());
      Alert.alert('Success', 'Check your email for the sign-in link');
    } catch (error) {
      console.error('Email sign in failed:', error);
      Alert.alert('Error', 'Failed to send sign-in email');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Signing in..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Shopping Lists</Text>
        <Text style={styles.subtitle}>Sign in to sync your lists across devices</Text>

        <View style={styles.emailSection}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email (optional)"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            text="Sign in with Email"
            onPress={handleEmailSignIn}
            style={styles.emailButton}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          text="Continue Anonymously"
          onPress={handleAnonymousSignIn}
          style={styles.anonymousButton}
          textStyle={styles.anonymousButtonText}
        />

        <Text style={styles.note}>
          Anonymous users can create and manage lists, but won&apos;t be able to sync across devices or receive email invitations.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  emailSection: {
    marginBottom: 32,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  emailButton: {
    backgroundColor: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  anonymousButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  anonymousButtonText: {
    color: colors.text,
  },
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AuthScreen;
