
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import Icon from './Icon';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMeLocal, setRememberMeLocal] = useState(false);
  
  const { signInAnonymously, signInWithEmail, signUpWithEmail, rememberMe } = useAuth();

  useEffect(() => {
    setRememberMeLocal(rememberMe);
  }, [rememberMe]);

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInAnonymously();
      if (result.error) {
        console.error('Anonymous sign in failed:', result.error);
      }
    } catch (error) {
      console.error('Anonymous sign in exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email.trim(), password);
      } else {
        result = await signInWithEmail(email.trim(), password, rememberMeLocal);
      }
      
      if (result.error) {
        console.error('Email auth failed:', result.error);
      }
    } catch (error) {
      console.error('Email auth exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.wrapper, styles.container]}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          {isSignUp ? 'Creating account...' : 'Signing in...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.wrapper, styles.container]}>
      <View style={styles.header}>
        <Icon name="basket" size={64} color={colors.accent} />
        <Text style={styles.title}>Shopping Lists</Text>
        <Text style={styles.subtitle}>
          Collaborate on shopping lists with friends and family
        </Text>
      </View>

      <View style={styles.authSection}>
        <Text style={styles.sectionTitle}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.grey}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email address input"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.grey}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Password input"
        />

        {!isSignUp && (
          <TouchableOpacity 
            style={styles.rememberMeContainer}
            onPress={() => setRememberMeLocal(!rememberMeLocal)}
            accessibilityLabel="Remember me checkbox"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMeLocal }}
          >
            <View style={[styles.checkbox, rememberMeLocal && styles.checkboxChecked]}>
              {rememberMeLocal && (
                <Icon name="checkmark" size={16} color={colors.background} />
              )}
            </View>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>
        )}

        <Button
          text={isSignUp ? 'Create Account' : 'Sign In'}
          onPress={handleEmailAuth}
          style={styles.primaryButton}
        />

        <Button
          text={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
          textStyle={styles.switchButtonText}
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.anonymousSection}>
        <Text style={styles.anonymousTitle}>Try Without Account</Text>
        <Text style={styles.anonymousSubtitle}>
          Use the app offline with local storage only
        </Text>
        
        <Button
          text="Continue Anonymously"
          onPress={handleAnonymousSignIn}
          style={styles.anonymousButton}
          textStyle={styles.anonymousButtonText}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          With an account, your lists sync across devices and you can collaborate in real-time
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  authSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grey,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grey,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rememberMeText: {
    fontSize: 16,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    marginBottom: 16,
  },
  switchButton: {
    backgroundColor: 'transparent',
  },
  switchButtonText: {
    color: colors.accent,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grey,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginHorizontal: 16,
  },
  anonymousSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  anonymousTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  anonymousSubtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  anonymousButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.grey,
  },
  anonymousButtonText: {
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
});
