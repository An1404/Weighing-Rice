import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessions } from '../context/SessionsContext';
import { RootStackParamList } from '../navigation/types';
import { parsePositiveNumber } from '../utils/session';

type StartNavigation = NativeStackNavigationProp<RootStackParamList, 'Start'>;

const formatVndInput = (value: string) => {
  if (!value) {
    return '';
  }

  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const sanitizeVndInput = (value: string) => value.replace(/[^\d]/g, '');

export function StartScreen() {
  const navigation = useNavigation<StartNavigation>();
  const { createSession } = useSessions();
  const [priceInput, setPriceInput] = useState('');

  const displayedPrice = formatVndInput(sanitizeVndInput(priceInput));

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('List');
  };

  const handleStart = () => {
    const parsedPrice = parsePositiveNumber(priceInput);

    if (parsedPrice === null) {
      Alert.alert('Giá lúa chưa hợp lệ', 'Vui lòng nhập đơn giá lớn hơn 0.');
      return;
    }

    const sessionId = createSession(parsedPrice);
    setPriceInput('');
    navigation.replace('Detail', { sessionId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.headerBack}>{'< Quay lại'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bắt đầu cân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.startCard}>
          <Text style={styles.inputLabel}>Nhập giá lúa (đ/kg)</Text>
          <TextInput
            value={displayedPrice}
            onChangeText={(text) => setPriceInput(sanitizeVndInput(text))}
            placeholder="Ví dụ: 8,200"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            style={styles.textInput}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
            <Text style={styles.primaryButtonText}>Bắt đầu cân</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 80,
  },
  startCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
