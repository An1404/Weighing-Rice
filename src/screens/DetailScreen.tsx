import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLUMN_COUNT, ITEMS_PER_COLUMN } from '../constants';
import { SessionSummary, WeighSession } from '../types';
import { formatNumber } from '../utils/session';

type DetailScreenProps = {
  session: WeighSession | null;
  summary: SessionSummary | null;
  quickBagA: string;
  quickBagB: string;
  onQuickBagAChange: (value: string) => void;
  onQuickBagBChange: (value: string) => void;
  onOpenColumnEditor: (columnIndex: number) => void;
  editingColumn: number | null;
  editingValues: string[];
  onChangeEditingValue: (index: number, value: string) => void;
  onCloseColumnEditor: () => void;
  onSaveColumnEditor: () => void;
  onCalculate: () => void;
  onBack: () => void;
};

export function DetailScreen({
  session,
  summary,
  quickBagA,
  quickBagB,
  onQuickBagAChange,
  onQuickBagBChange,
  onOpenColumnEditor,
  editingColumn,
  editingValues,
  onChangeEditingValue,
  onCloseColumnEditor,
  onSaveColumnEditor,
  onCalculate,
  onBack,
}: DetailScreenProps) {
  if (!session || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy phiên cân</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
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
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.headerBack}>{'< Danh sách'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cân lúa chi tiết</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLine}>Đơn giá: {formatNumber(session.price)} đ/kg</Text>
          <Text style={styles.summaryLine}>Số lượng bao: {summary.totalBags}</Text>
          <Text style={styles.summaryLine}>Tổng khối lượng: {formatNumber(summary.totalWeight)} kg</Text>
          <Text style={styles.summaryLine}>Tổng tiền: {formatNumber(summary.grossMoney)} đ</Text>
        </View>

        <ScrollView contentContainerStyle={styles.columnsContainer}>
          <View style={styles.columnsRow}>
            {Array.from({ length: COLUMN_COUNT }, (_, columnIndex) => {
              const start = columnIndex * ITEMS_PER_COLUMN;
              const values = session.bags.slice(start, start + ITEMS_PER_COLUMN);

              return (
                <TouchableOpacity key={columnIndex} style={styles.columnCard} onPress={() => onOpenColumnEditor(columnIndex)}>
                  <Text style={styles.columnTitle}>Cột {columnIndex + 1}</Text>
                  {values.map((value, itemIndex) => (
                    <View key={itemIndex} style={styles.columnItem}>
                      <Text style={styles.columnItemLabel}>Bao {start + itemIndex + 1}</Text>
                      <Text style={styles.columnItemValue}>{value === null ? '--' : formatNumber(value)}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.quickAddCard}>
          <Text style={styles.inputLabel}>Nhập nhanh 2 bao (tự thêm khi đủ 2 số)</Text>
          <View style={styles.quickInputRow}>
            <TextInput
              value={quickBagA}
              onChangeText={onQuickBagAChange}
              placeholder="Bao 1"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              style={[styles.textInput, styles.quickInput]}
            />
            <TextInput
              value={quickBagB}
              onChangeText={onQuickBagBChange}
              placeholder="Bao 2"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              style={[styles.textInput, styles.quickInput]}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onCalculate}>
            <Text style={styles.primaryButtonText}>Tính tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent animationType="slide" visible={editingColumn !== null} onRequestClose={onCloseColumnEditor}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa Cột {(editingColumn ?? 0) + 1}</Text>

            {editingValues.map((value, index) => (
              <View key={index} style={styles.modalInputRow}>
                <Text style={styles.modalInputLabel}>Bao {(editingColumn ?? 0) * ITEMS_PER_COLUMN + index + 1}</Text>
                <TextInput
                  value={value}
                  onChangeText={(text) => onChangeEditingValue(index, text)}
                  placeholder="Để trống nếu xoá"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  style={[styles.textInput, styles.modalInput]}
                />
              </View>
            ))}

            <View style={styles.modalButtonRow}>
              <Pressable style={styles.secondaryButton} onPress={onCloseColumnEditor}>
                <Text style={styles.secondaryButtonText}>Huỷ</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={onSaveColumnEditor}>
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 5,
  },
  summaryLine: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  columnsContainer: {
    paddingVertical: 12,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  columnCard: {
    minWidth: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    gap: 6,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  columnItem: {
    borderRadius: 8,
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
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
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
  },
  quickInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickInput: {
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
