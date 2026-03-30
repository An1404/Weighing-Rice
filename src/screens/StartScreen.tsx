import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type StartScreenProps = {
  priceInput: string;
  onChangePrice: (value: string) => void;
  onBack: () => void;
  onStart: () => void;
};

export function StartScreen({ priceInput, onChangePrice, onBack, onStart }: StartScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.headerBack}>{'< Quay lại'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bắt đầu cân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.startCard}>
          <Text style={styles.inputLabel}>Nhập giá lúa (đ/kg)</Text>
          <TextInput
            value={priceInput}
            onChangeText={onChangePrice}
            placeholder="Ví dụ: 8200"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            style={styles.textInput}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={onStart}>
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
