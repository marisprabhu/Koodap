import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { databaseService } from './src/services/databaseService';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    async function bootstrap() {
      await databaseService.init();
      const granted = await notificationService.requestPermissions();
      if (granted) await notificationService.scheduleDailyDebrief(21, 0); // 9 PM
    }
    bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
