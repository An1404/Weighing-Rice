import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TRU_BI_MOI_BAO } from '../constants';
import { ResultTab, SessionSummary, WeighSession } from '../types';
import { formatNumber } from '../utils/session';

type ResultScreenProps = {
  session: WeighSession | null;
  summary: SessionSummary | null;
  resultTab: ResultTab;
  onChangeTab: (tab: ResultTab) => void;
  onBack: () => void;
};

export function ResultScreen({ session, summary, resultTab, onChangeTab, onBack }: ResultScreenProps) {
  if (!session || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
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
          <Text style={styles.headerTitle}>Kết quả cân</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, resultTab === 'summary' && styles.tabButtonActive]}
            onPress={() => onChangeTab('summary')}
          >
            <Text style={[styles.tabText, resultTab === 'summary' && styles.tabTextActive]}>Tổng quan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, resultTab === 'bags' && styles.tabButtonActive]}
            onPress={() => onChangeTab('bags')}
          >
            <Text style={[styles.tabText, resultTab === 'bags' && styles.tabTextActive]}>Danh sách bao</Text>
          </TouchableOpacity>
        </View>

        {resultTab === 'summary' ? (
          <View style={styles.summaryResultCard}>
            <ResultRow label="Tổng bao" value={String(summary.totalBags)} />
            <ResultRow label="Tổng khối lượng" value={`${formatNumber(summary.totalWeight)} kg`} />
            <ResultRow label={`Trừ bì (${TRU_BI_MOI_BAO}kg/bao)`} value={`${formatNumber(summary.tare)} kg`} />
            <ResultRow label="Còn lại" value={`${formatNumber(summary.netWeight)} kg`} />
            <ResultRow label="Giá lúa" value={`${formatNumber(session.price)} đ/kg`} />
            <ResultRow label="Thành tiền" value={`${formatNumber(summary.finalMoney)} đ`} isHighlight />
          </View>
        ) : (
          <FlatList
            data={summary.bagValues}
            keyExtractor={(_, index) => `${session.id}-${index}`}
            contentContainerStyle={styles.resultListContent}
            ListEmptyComponent={<Text style={styles.emptyText}>Không có bao nào.</Text>}
            renderItem={({ item, index }) => (
              <View style={styles.resultListItem}>
                <Text style={styles.resultListIndex}>Bao {index + 1}</Text>
                <Text style={styles.resultListValue}>{formatNumber(item)} kg</Text>
              </View>
            )}
          />
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
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
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
  resultLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  resultValueHighlight: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '800',
  },
  resultListContent: {
    paddingBottom: 20,
    gap: 8,
  },
  resultListItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultListIndex: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  resultListValue: {
    color: '#2563eb',
    fontSize: 14,
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
