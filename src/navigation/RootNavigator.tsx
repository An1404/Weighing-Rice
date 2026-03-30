import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSessions } from '../context/SessionsContext';
import { DetailScreen } from '../screens/DetailScreen';
import { ListScreen } from '../screens/ListScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StartScreen } from '../screens/StartScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isHydrated } = useSessions();

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="List"
      screenOptions={{
        headerShown: false,
        contentStyle: styles.content,
      }}
    >
      <Stack.Screen name="List" component={ListScreen} />
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
});
