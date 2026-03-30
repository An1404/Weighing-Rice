import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ITEMS_PER_COLUMN } from '../constants';
import { useSessions } from '../context/SessionsContext';
import { RootStackParamList } from '../navigation/types';
import { ResultTab } from '../types';
import { calcSummary, formatNumber } from '../utils/session';

type ResultRoute = RouteProp<RootStackParamList, 'Result'>;
type ResultNavigation = NativeStackNavigationProp<RootStackParamList, 'Result'>;

const screenWidth = Dimensions.get('window').width;
const MAX_COLUMNS_PER_ROW = 5;
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 10;
const columnWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - (MAX_COLUMNS_PER_ROW - 1) * COLUMN_GAP) / MAX_COLUMNS_PER_ROW;

const sanitizeTareInput = (raw: string): string => {
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');

  if (!normalized) {
    return '';
  }

  const [wholePart, ...fractionParts] = normalized.split('.');
  const whole = wholePart === '' ? '0' : wholePart;

  if (fractionParts.length === 0) {
    return whole;
  }

  const fraction = fractionParts.join('').slice(0, 2);
  return fraction.length > 0 ? `${whole}.${fraction}` : `${whole}.`;
};

const parseTareInput = (raw: string): { value: number | null; isValid: boolean } => {
  const normalized = raw.trim().replace(',', '.');

  if (!normalized) {
    return { value: null, isValid: true };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, isValid: false };
  }

  return { value: parsed, isValid: true };
};

export function ResultScreen() {
  const navigation = useNavigation<ResultNavigation>();
  const route = useRoute<ResultRoute>();
  const { getSessionById, updateSession } = useSessions();

  const session = getSessionById(route.params.sessionId);
  const summary = useMemo(() => (session ? calcSummary(session) : null), [session]);
  const visibleColumns = useMemo(() => {
    if (!session) {
      return [];
    }

    const totalColumns = Math.ceil(session.bags.length / ITEMS_PER_COLUMN);

    return Array.from({ length: totalColumns }, (_, columnIndex) => {
      const start = columnIndex * ITEMS_PER_COLUMN;
      const values = session.bags.slice(start, start + ITEMS_PER_COLUMN);

      if (!values.some((value) => value !== null)) {
        return null;
      }

      return { columnIndex, values };
    }).filter((column): column is { columnIndex: number; values: typeof session.bags } => column !== null);
  }, [session]);

  const [resultTab, setResultTab] = useState<ResultTab>('summary');
  const [tareInput, setTareInput] = useState('');

  const persistTareInput = useCallback(() => {
    if (!session) {
      return true;
    }

    const { value, isValid } = parseTareInput(tareInput);
    if (!isValid) {
      Alert.alert('Giá trị bì chưa hợp lệ', 'Vui lòng nhập tổng kg bì là số lớn hơn hoặc bằng 0.');
      return false;
    }

    updateSession(session.id, (old) => {
      const currentTare = old.totalTareKg;
      if (currentTare === value) {
        return old;
      }

      return {
        ...old,
        totalTareKg: value,
      };
    });

    return true;
  }, [session, tareInput, updateSession]);

  const handleBackToList = useCallback(() => {
    if (!persistTareInput()) {
      return;
    }

    navigation.navigate('List');
  }, [navigation, persistTareInput]);

  useEffect(() => {
    setResultTab('summary');
  }, [route.params.sessionId]);

  useEffect(() => {
    setTareInput(typeof session?.totalTareKg === 'number' ? String(session.totalTareKg) : '');
  }, [session?.id, session?.totalTareKg]);

  if (!session || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('List')}>
            <Text style={styles.primaryButtonText}>Về danh sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBackToList}>
            <Text style={styles.headerBack}>{'< Danh sách'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả cân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, resultTab === 'summary' && styles.tabButtonActive]}
            onPress={() => setResultTab('summary')}
          >
            <Text style={[styles.tabText, resultTab === 'summary' && styles.tabTextActive]}>Tổng tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, resultTab === 'bags' && styles.tabButtonActive]}
            onPress={() => setResultTab('bags')}
          >
            <Text style={[styles.tabText, resultTab === 'bags' && styles.tabTextActive]}>Danh sách bao</Text>
          </TouchableOpacity>
        </View>

        {resultTab === 'summary' ? (
          <View style={styles.summaryResultCard}>
            <ResultRow label="Tổng bao" value={String(summary.totalBags)} />
            <ResultRow label="Tổng khối lượng" value={`${formatNumber(summary.totalWeight)} kg`} />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Trừ bì</Text>
              <View style={styles.tareInputWrap}>
                <TextInput
                  value={tareInput}
                  onChangeText={(text) => setTareInput(sanitizeTareInput(text))}
                  onBlur={() => {
                    persistTareInput();
                  }}
                  onSubmitEditing={() => {
                    persistTareInput();
                  }}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  style={styles.tareInput}
                />
                <Text style={styles.resultValue}>kg</Text>
              </View>
            </View>
            <ResultRow label="Còn lại" value={`${formatNumber(summary.netWeight)} kg`} />
            <ResultRow label="Giá lúa" value={`${formatNumber(session.price)} đ/kg`} />
            <ResultRow label="Thành tiền" value={`${formatNumber(summary.finalMoney)} đ`} isHighlight />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.columnsContainer}>
            {visibleColumns.length === 0 ? (
              <Text style={styles.emptyText}>Không có bao nào.</Text>
            ) : (
              <View style={styles.columnsRow}>
                {visibleColumns.map(({ columnIndex, values }) => (
                  <View key={columnIndex} style={[styles.columnCard, { width: columnWidth }]}>
                    <Text style={styles.columnTitle}>{columnIndex + 1}</Text>
                    {values.map((value, itemIndex) => (
                      <View key={itemIndex} style={styles.columnItem}>
                        <Text style={styles.columnItemValue}>{value === null ? '--' : formatNumber(value)}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

type ResultRowProps = {
  label: string;
  value: string;
  isHighlight?: boolean;
};

function ResultRow({ label, value, isHighlight = false }: ResultRowProps) {
  return (
    <View style={[styles.resultRow, {borderBottomWidth: isHighlight ? 0 : 1}]}>
      <Text style={[styles.resultLabel,{fontSize: isHighlight? 24:20}]}>{label}</Text>
      <Text style={isHighlight ? styles.resultValueHighlight : styles.resultValue}>{value}</Text>
    </View>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  summaryResultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
  },
  tareInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tareInput: {
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'right',
  },
  resultLabel: {
    fontSize: 20,
    color: '#4b5563',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
  },
  resultValueHighlight: {
    fontSize: 24,
    color: '#2563eb',
    fontWeight: '800',
  },
  columnsContainer: {
    paddingVertical: 12,
  },
  columnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  columnCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
    overflow: 'hidden',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
  },
  columnItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  columnItemValue: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    minWidth: 130,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
