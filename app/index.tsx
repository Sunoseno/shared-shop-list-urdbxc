
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function MainScreen() {
  useEffect(() => {
    console.log('Main screen loaded, redirecting to lists');
  }, []);

  return <Redirect href="/lists" />;
}
