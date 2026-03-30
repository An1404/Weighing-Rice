import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ITEMS_PER_COLUMN } from '../constants';
import { useSessions } from '../context/SessionsContext';
import { RootStackParamList } from '../navigation/types';
import { BagWeight, WeighSession } from '../types';
import { calcSummary, formatNumber, parsePositiveNumber } from '../utils/session';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;
type DetailNavigation = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

const screenWidth = Dimensions.get('window').width;
const MAX_COLUMNS_PER_ROW = 5;
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 10;
const columnWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - (MAX_COLUMNS_PER_ROW - 1) * COLUMN_GAP) / MAX_COLUMNS_PER_ROW;

export function DetailScreen() {
  const navigation = useNavigation<DetailNavigation>();
  const route = useRoute<DetailRoute>();
  const {bottom} = useSafeAreaInsets()
  const { getSessionById, markSessionCompleted, updateSession } = useSessions();

  const session = getSessionById(route.params.sessionId);
  const summary = useMemo(() => (session ? calcSummary(session) : null), [session]);

  const [quickBagInput, setQuickBagInput] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<string[]>([]);
  const [pendingScrollColumn, setPendingScrollColumn] = useState<number | null>(null);
  const columnsScrollRef = useRef<ScrollView | null>(null);
  const columnOffsetsRef = useRef<Record<number, number>>({});

  const appendWeightsToSession = useCallback(
    (weights: number[]) => {
      if (!session) {
        return null;
      }

      const nextBags = [...session.bags];
      let lastInsertedBagIndex: number | null = null;

      for (const weight of weights) {
        const emptyIndex = nextBags.findIndex((bag) => bag === null);

        if (emptyIndex !== -1) {
          nextBags[emptyIndex] = weight;
          lastInsertedBagIndex = emptyIndex;
          continue;
        }

        lastInsertedBagIndex = nextBags.length;
        nextBags.push(weight);
      }

      updateSession(session.id, (old) => ({
        ...old,
        bags: nextBags,
      }));

      return lastInsertedBagIndex;
    },
    [session, updateSession],
  );

  const handleQuickBagInputChange = useCallback(
    (text: string) => {
      const nextValue = text.replace(/[^\d]/g, '').slice(0, 2);
      setQuickBagInput(nextValue);

      if (nextValue.length !== 2) {
        return;
      }

      const parsed = parsePositiveNumber(nextValue);
      if (parsed === null) {
        return;
      }

      const addedBagIndex = appendWeightsToSession([parsed]);
      if (addedBagIndex !== null) {
        setQuickBagInput('');
        setPendingScrollColumn(Math.floor(addedBagIndex / ITEMS_PER_COLUMN));
      }
    },
    [appendWeightsToSession],
  );

  const scrollToColumn = useCallback((columnIndex: number) => {
    const offsetY = columnOffsetsRef.current[columnIndex];

    if (typeof offsetY !== 'number') {
      return false;
    }

    columnsScrollRef.current?.scrollTo({
      y: Math.max(offsetY - 8, 0),
      animated: true,
    });

    return true;
  }, []);

  const handleColumnLayout = useCallback(
    (columnIndex: number, offsetY: number) => {
      columnOffsetsRef.current[columnIndex] = offsetY;

      if (pendingScrollColumn === columnIndex) {
        scrollToColumn(columnIndex);
        setPendingScrollColumn(null);
      }
    },
    [pendingScrollColumn, scrollToColumn],
  );

  const openColumnEditor = useCallback(
    (columnIndex: number) => {
      if (!session) {
        return;
      }

      const start = columnIndex * ITEMS_PER_COLUMN;
      const values = Array.from({ length: ITEMS_PER_COLUMN }, (_, offset) => {
        const bag = session.bags[start + offset] ?? null;
        return bag === null ? '' : String(bag);
      });

      setEditingValues(values);
      setEditingColumn(columnIndex);
    },
    [session],
  );

  const saveColumnEditor = useCallback(() => {
    if (!session || editingColumn === null) {
      return;
    }

    const normalized: BagWeight[] = [];

    for (const value of editingValues) {
      if (!value.trim()) {
        normalized.push(null);
        continue;
      }

      const parsed = parsePositiveNumber(value);
      if (parsed === null) {
        Alert.alert('Dữ liệu chưa hợp lệ', 'Mỗi bao phải là số lớn hơn 0 hoặc để trống.');
        return;
      }

      normalized.push(parsed);
    }

    const nextBags = [...session.bags];
    const start = editingColumn * ITEMS_PER_COLUMN;

    normalized.forEach((value, index) => {
      nextBags[start + index] = value;
    });

    while (nextBags.length > 0 && nextBags[nextBags.length - 1] === null) {
      nextBags.pop();
    }

    updateSession(session.id, (old) => ({
      ...old,
      bags: nextBags,
    }));

    setEditingColumn(null);
    setEditingValues([]);
  }, [session, editingColumn, editingValues, updateSession]);

  const closeColumnEditor = useCallback(() => {
    setEditingColumn(null);
    setEditingValues([]);
  }, []);

  const calculateResult = useCallback(() => {
    if (!session || !summary) {
      return;
    }

    if (summary.totalBags === 0) {
      Alert.alert('Chưa có bao nào', 'Vui lòng nhập ít nhất 1 bao trước khi tính tiền.');
      return;
    }

    // markSessionCompleted(session.id);
    navigation.navigate('Result', { sessionId: session.id });
  }, [session, summary, markSessionCompleted, navigation]);

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
    }).filter((column): column is { columnIndex: number; values: WeighSession['bags'] } => column !== null);
  }, [session]);

  useEffect(() => {
    if (pendingScrollColumn === null) {
      return;
    }

    if (scrollToColumn(pendingScrollColumn)) {
      setPendingScrollColumn(null);
    }
  }, [pendingScrollColumn, scrollToColumn, visibleColumns.length]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!session || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy phiên cân</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('List')}>
            <Text style={styles.primaryButtonText}>Về danh sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback  onPress={() => Keyboard.dismiss()}>
          <View style={styles.screenContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.navigate('List')}>
                <Text style={styles.headerBack}>{'< Danh sách'}</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cân lúa chi tiết</Text>
            <View style={styles.headerSpacer} />
          </View>

            <View style={[styles.summaryCard, isKeyboardVisible && Platform.OS === 'android' &&{marginTop:screenWidth*0.5 + bottom}]}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.summaryLine}>Đơn giá: {formatNumber(session.price)} đ</Text>
                <Text style={styles.summaryLine}>Số lượng bao: {summary.totalBags}</Text>
              </View>
              <Text style={styles.summaryLine}>Tổng khối lượng: {formatNumber(summary.totalWeight)} kg</Text>
              <Text style={[styles.summaryLine,{color:'#2563eb'}]}>Tổng tiền: {formatNumber(summary.grossMoney)} đ</Text>
            </View>
         
          <ScrollView
            ref={columnsScrollRef}
            contentContainerStyle={styles.columnsContainer}
          >
            <View style={styles.columnsRow}>
              {visibleColumns.map(({ columnIndex, values }) => (
                <TouchableOpacity
                  key={columnIndex}
                  style={[styles.columnCard, { width: columnWidth }]}
                  onPress={() => openColumnEditor(columnIndex)}
                  onLayout={(event) => handleColumnLayout(columnIndex, event.nativeEvent.layout.y)}
                >
                  <Text style={styles.columnTitle}>{columnIndex + 1}</Text>
                  {values.map((value, itemIndex) => (
                    <View key={itemIndex} style={styles.columnItem}>
                      <Text style={styles.columnItemValue}>{value === null ? '--' : formatNumber(value)}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.quickAddCard}>
            <Text style={styles.inputLabel}>Nhập số kg vừa cân</Text>
           <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent:'center' }}>
             <TextInput
              value={quickBagInput}
              onChangeText={handleQuickBagInputChange}
              placeholder="Ví dụ: 50"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={2}
              style={styles.textInput}
            />

            <TouchableOpacity style={[styles.primaryButton,{marginTop:0}]} onPress={calculateResult}>
              <Text style={styles.primaryButtonText}>Tính tiền</Text>
            </TouchableOpacity>
           </View>
          </View>
          </View>
        
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal transparent animationType="slide" visible={editingColumn !== null} onRequestClose={closeColumnEditor}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa Cột {(editingColumn ?? 0) + 1}</Text>

            {editingValues.map((value, index) => {
              if (!value.trim()) {
                return null;
              }

              return (
                <View key={index} style={styles.modalInputRow}>
                  <Text style={styles.modalInputLabel}>Bao {(editingColumn ?? 0) * ITEMS_PER_COLUMN + index + 1}</Text>
                  <TextInput
                    value={value}
                    onChangeText={(text) =>
                      setEditingValues((prev) => prev.map((item, itemIndex) => (itemIndex === index ? text : item)))
                    }
                    placeholder="Để trống nếu xoá"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    style={[styles.textInput, styles.modalInput]}
                  />
                </View>
              );
            })}

            <View style={styles.modalButtonRow}>
              <Pressable style={styles.secondaryButton} onPress={closeColumnEditor}>
                <Text style={styles.secondaryButtonText}>Huỷ</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={saveColumnEditor}>
                <Text style={styles.primaryButtonText}>Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 5,
  },
  summaryCardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLine: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  summaryLineCompact: {
    fontSize: 16,
  },
  columnsContainer: {
    paddingVertical: 12,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
    gap: 2,
  },
  columnItemLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  columnItemValue: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  quickAddCard: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 10,
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
    flex: 1,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  primaryButtonSmall: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    width: 150,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalInputLabel: {
    width: 70,
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  modalInput: {
    flex: 1,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
});
