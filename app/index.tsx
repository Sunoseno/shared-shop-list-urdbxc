
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '../styles/commonStyles';

export default function MainScreen() {
  useEffect(() => {
    console.log('Main screen loaded, redirecting to lists');
  }, []);

  // Show a temporary test screen first
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background, 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 20
    }}>
      <Text style={{ 
        fontSize: 24, 
        color: colors.text, 
        textAlign: 'center',
        marginBottom: 20
      }}>
        Shopping List App
      </Text>
      <Text style={{ 
        fontSize: 16, 
        color: colors.text, 
        textAlign: 'center'
      }}>
        Loading...
      </Text>
      <Redirect href="/lists" />
    </View>
  );
}
