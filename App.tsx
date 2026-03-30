import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionsProvider } from './src/context/SessionsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f3f4f6',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionsProvider>
        <NavigationContainer theme={appTheme}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SessionsProvider>
    </SafeAreaProvider>
  );
}
