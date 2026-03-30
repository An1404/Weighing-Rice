import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';

import { ITEMS_PER_COLUMN, MAX_BAGS } from './src/constants';
import { DetailScreen } from './src/screens/DetailScreen';
import { ListScreen } from './src/screens/ListScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { StartScreen } from './src/screens/StartScreen';
import { BagWeight, ResultTab, ScreenState, WeighSession } from './src/types';
import { calcSummary, parsePositiveNumber } from './src/utils/session';

const createEmptyBags = (): BagWeight[] => Array.from({ length: MAX_BAGS }, () => null);

export default function App() {
  const [sessions, setSessions] = useState<WeighSession[]>([]);
  const [screen, setScreen] = useState<ScreenState>({ name: 'list' });

  const [priceInput, setPriceInput] = useState('');
  const [quickBagA, setQuickBagA] = useState('');
  const [quickBagB, setQuickBagB] = useState('');

  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<string[]>([]);

  const [resultTab, setResultTab] = useState<ResultTab>('summary');

  const activeSession = useMemo(() => {
    if (screen.name !== 'detail' && screen.name !== 'result') {
      return null;
    }

    return sessions.find((session) => session.id === screen.sessionId) ?? null;
  }, [screen, sessions]);

  const activeSummary = useMemo(() => {
    if (!activeSession) {
      return null;
    }

    return calcSummary(activeSession);
  }, [activeSession]);

  const updateSession = useCallback(
    (sessionId: string, updater: (old: WeighSession) => WeighSession) => {
      setSessions((prev) => prev.map((session) => (session.id === sessionId ? updater(session) : session)));
    },
    [],
  );

  const startSession = () => {
    const parsedPrice = parsePositiveNumber(priceInput);

    if (parsedPrice === null) {
      Alert.alert('Giá lúa chưa hợp lệ', 'Vui lòng nhập đơn giá lớn hơn 0.');
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const newSession: WeighSession = {
      id,
      createdAt: Date.now(),
      price: parsedPrice,
      bags: createEmptyBags(),
      completed: false,
    };

    setSessions((prev) => [newSession, ...prev]);
    setPriceInput('');
    setQuickBagA('');
    setQuickBagB('');
    setEditingColumn(null);
    setEditingValues([]);
    setScreen({ name: 'detail', sessionId: id });
  };

  const appendWeightsToActiveSession = useCallback(
    (weights: number[]) => {
      if (!activeSession) {
        return false;
      }

      const nextBags = [...activeSession.bags];
      let addedCount = 0;

      for (const weight of weights) {
        const emptyIndex = nextBags.findIndex((bag) => bag === null);
        if (emptyIndex === -1) {
          break;
        }

        nextBags[emptyIndex] = weight;
        addedCount += 1;
      }

      if (addedCount === 0) {
        Alert.alert('Đã đủ 25 bao', 'Không thể thêm bao mới.');
        return false;
      }

      updateSession(activeSession.id, (old) => ({
        ...old,
        bags: nextBags,
      }));

      if (addedCount < weights.length) {
        Alert.alert('Đã đầy một phần', 'Chỉ thêm được một phần số bao vì đã đủ chỗ.');
      }

      return true;
    },
    [activeSession, updateSession],
  );

  const tryAutoAddQuickPair = useCallback(
    (nextA: string, nextB: string) => {
      const parsedA = parsePositiveNumber(nextA);
      const parsedB = parsePositiveNumber(nextB);

      if (parsedA === null || parsedB === null) {
        return;
      }

      const added = appendWeightsToActiveSession([parsedA, parsedB]);
      if (added) {
        setQuickBagA('');
        setQuickBagB('');
        Keyboard.dismiss();
      }
    },
    [appendWeightsToActiveSession],
  );

  const openColumnEditor = (columnIndex: number) => {
    if (!activeSession) {
      return;
    }

    const start = columnIndex * ITEMS_PER_COLUMN;
    const end = start + ITEMS_PER_COLUMN;
    const values = activeSession.bags.slice(start, end).map((bag) => (bag === null ? '' : String(bag)));

    setEditingValues(values);
    setEditingColumn(columnIndex);
  };

  const saveColumnEditor = () => {
    if (!activeSession || editingColumn === null) {
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

    const nextBags = [...activeSession.bags];
    const start = editingColumn * ITEMS_PER_COLUMN;

    normalized.forEach((value, index) => {
      nextBags[start + index] = value;
    });

    updateSession(activeSession.id, (old) => ({
      ...old,
      bags: nextBags,
    }));

    setEditingColumn(null);
    setEditingValues([]);
  };

  const closeColumnEditor = () => {
    setEditingColumn(null);
    setEditingValues([]);
  };

  const openSession = (session: WeighSession) => {
    setResultTab('summary');

    if (session.completed) {
      setScreen({ name: 'result', sessionId: session.id });
      return;
    }

    setScreen({ name: 'detail', sessionId: session.id });
  };

  const calculateResult = () => {
    if (!activeSession || !activeSummary) {
      return;
    }

    if (activeSummary.totalBags === 0) {
      Alert.alert('Chưa có bao nào', 'Vui lòng nhập ít nhất 1 bao trước khi tính tiền.');
      return;
    }

    updateSession(activeSession.id, (old) => ({
      ...old,
      completed: true,
    }));

    setResultTab('summary');
    setScreen({ name: 'result', sessionId: activeSession.id });
  };

  return (
    <View style={styles.appRoot}>
      {screen.name === 'list' && (
        <ListScreen
          sessions={sessions}
          onCreateSession={() => setScreen({ name: 'start' })}
          onOpenSession={openSession}
        />
      )}

      {screen.name === 'start' && (
        <StartScreen
          priceInput={priceInput}
          onChangePrice={setPriceInput}
          onBack={() => setScreen({ name: 'list' })}
          onStart={startSession}
        />
      )}

      {screen.name === 'detail' && (
        <DetailScreen
          session={activeSession}
          summary={activeSummary}
          quickBagA={quickBagA}
          quickBagB={quickBagB}
          onQuickBagAChange={(text) => {
            setQuickBagA(text);
            tryAutoAddQuickPair(text, quickBagB);
          }}
          onQuickBagBChange={(text) => {
            setQuickBagB(text);
            tryAutoAddQuickPair(quickBagA, text);
          }}
          onOpenColumnEditor={openColumnEditor}
          editingColumn={editingColumn}
          editingValues={editingValues}
          onChangeEditingValue={(index, value) => {
            setEditingValues((prev) => prev.map((item, i) => (i === index ? value : item)));
          }}
          onCloseColumnEditor={closeColumnEditor}
          onSaveColumnEditor={saveColumnEditor}
          onCalculate={calculateResult}
          onBack={() => setScreen({ name: 'list' })}
        />
      )}

      {screen.name === 'result' && (
        <ResultScreen
          session={activeSession}
          summary={activeSummary}
          resultTab={resultTab}
          onChangeTab={setResultTab}
          onBack={() => setScreen({ name: 'list' })}
        />
      )}

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});
