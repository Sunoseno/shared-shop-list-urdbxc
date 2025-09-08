
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';
import Button from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  handleReset = () => {
    console.log('ErrorBoundary: Resetting error state');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={[commonStyles.container, styles.errorContainer]}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            text="Try Again"
            onPress={this.handleReset}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});
