import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { BagWeight, WeighSession } from '../types';

const STORAGE_KEY = '@rice-weighing/sessions';

type SessionsContextValue = {
  sessions: WeighSession[];
  isHydrated: boolean;
  createSession: (price: number) => string;
  updateSession: (sessionId: string, updater: (old: WeighSession) => WeighSession) => void;
  getSessionById: (sessionId: string) => WeighSession | null;
  markSessionCompleted: (sessionId: string) => void;
};

const SessionsContext = createContext<SessionsContextValue | undefined>(undefined);

const isBagWeight = (value: unknown): value is BagWeight =>
  value === null || (typeof value === 'number' && Number.isFinite(value) && value > 0);

type StoredWeighSession = Omit<WeighSession, 'totalTareKg'> & {
  totalTareKg?: number | null;
};

const isTareWeight = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);

const isWeighSession = (value: unknown): value is StoredWeighSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredWeighSession>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt) &&
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    candidate.price > 0 &&
    Array.isArray(candidate.bags) &&
    candidate.bags.every(isBagWeight) &&
    isTareWeight(candidate.totalTareKg) &&
    typeof candidate.completed === 'boolean'
  );
};

const parseStoredSessions = (raw: string | null): WeighSession[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWeighSession).map((session) => ({
      ...session,
      totalTareKg: typeof session.totalTareKg === 'number' ? session.totalTareKg : null,
    }));
  } catch {
    return [];
  }
};

type SessionsProviderProps = {
  children: ReactNode;
};

export function SessionsProvider({ children }: SessionsProviderProps) {
  const [sessions, setSessions] = useState<WeighSession[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSessions = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) {
          return;
        }

        setSessions(parseStoredSessions(raw));
      } catch (error) {
        console.warn('Cannot read sessions from storage', error);
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    };

    loadSessions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch((error) => {
      console.warn('Cannot save sessions to storage', error);
    });
  }, [isHydrated, sessions]);

  const createSession = useCallback((price: number) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    const newSession: WeighSession = {
      id,
      createdAt: Date.now(),
      price,
      bags: [],
      totalTareKg: null,
      completed: false,
    };

    setSessions((prev) => [newSession, ...prev]);

    return id;
  }, []);

  const updateSession = useCallback((sessionId: string, updater: (old: WeighSession) => WeighSession) => {
    setSessions((prev) => prev.map((session) => (session.id === sessionId ? updater(session) : session)));
  }, []);

  const markSessionCompleted = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (old) => ({
        ...old,
        completed: true,
      }));
    },
    [updateSession],
  );

  const sessionsById = useMemo(() => {
    return new Map(sessions.map((session) => [session.id, session]));
  }, [sessions]);

  const getSessionById = useCallback(
    (sessionId: string) => {
      return sessionsById.get(sessionId) ?? null;
    },
    [sessionsById],
  );

  const value = useMemo<SessionsContextValue>(
    () => ({
      sessions,
      isHydrated,
      createSession,
      updateSession,
      getSessionById,
      markSessionCompleted,
    }),
    [sessions, isHydrated, createSession, updateSession, getSessionById, markSessionCompleted],
  );

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export const useSessions = () => {
  const context = useContext(SessionsContext);

  if (!context) {
    throw new Error('useSessions must be used within SessionsProvider');
  }

  return context;
};
