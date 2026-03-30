import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessions } from '../context/SessionsContext';
import { RootStackParamList } from '../navigation/types';
import { WeighSession } from '../types';
import { calcSummary, formatDateTime, formatNumber } from '../utils/session';

type ListNavigation = NativeStackNavigationProp<RootStackParamList, 'List'>;

export function ListScreen() {
  const navigation = useNavigation<ListNavigation>();
  const { sessions } = useSessions();

  const openSession = (session: WeighSession) => {
    if (session.completed) {
      navigation.navigate('Result', { sessionId: session.id });
      return;
    }

    navigation.navigate('Detail', { sessionId: session.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <Text style={styles.screenTitle}>Danh sách lần cân</Text>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có lần cân nào</Text>
              <Text style={styles.emptyText}>Nhấn dấu + để bắt đầu lần cân mới.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const summary = calcSummary(item);
            return (
              <TouchableOpacity style={styles.sessionCard} onPress={() => openSession(item)}>
                <View style={styles.cardRowBetween}>
                  <Text style={styles.sessionCardTitle}>{formatDateTime(item.createdAt)}</Text>
                  <Text style={item.completed ? styles.doneBadge : styles.pendingBadge}>
                    {item.completed ? 'Hoàn tất' : 'Đang cân'}
                  </Text>
                </View>

                <Text style={styles.sessionCardLine}>Đơn giá: {formatNumber(item.price)} đ/kg</Text>
                <Text style={styles.sessionCardLine}>Số bao: {summary.totalBags}</Text>
                <Text style={styles.sessionCardLine}>Tổng khối lượng: {formatNumber(summary.totalWeight)} kg</Text>
                <Text style={styles.sessionCardLine}>Thành tiền: {formatNumber(summary.finalMoney)} đ</Text>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Start')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 100,
    gap: 12,
  },
  emptyCard: {
    marginTop: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  cardRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sessionCardLine: {
    fontSize: 20,
    color: '#374151',
  },
  doneBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 36,
  },
});
