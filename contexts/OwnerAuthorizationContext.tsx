import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { fetchIsOwner, OWNER_AUTHORIZATION_ERROR } from '@/lib/ownerService';

interface OwnerAuthorizationContextValue {
  isOwner: boolean;
  isOwnerLoading: boolean;
  ownerAuthorizationError: string | null;
  refreshOwnerAuthorization: () => Promise<void>;
}

const OwnerAuthorizationContext = createContext<OwnerAuthorizationContextValue | null>(null);

export function OwnerAuthorizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [ownerAuthorizationError, setOwnerAuthorizationError] = useState<string | null>(null);

  const runOwnerCheck = useCallback(async (currentUserId: string | null) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!mountedRef.current) return;
    setIsOwner(false);
    setOwnerAuthorizationError(null);

    if (!currentUserId) {
      setIsOwnerLoading(false);
      return;
    }

    setIsOwnerLoading(true);

    try {
      const owner = await fetchIsOwner();
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setIsOwner(owner);
    } catch {
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setIsOwner(false);
      setOwnerAuthorizationError(OWNER_AUTHORIZATION_ERROR);
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setIsOwnerLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      setIsOwner(false);
      setOwnerAuthorizationError(null);
      setIsOwnerLoading(true);
      return;
    }

    runOwnerCheck(userId);
  }, [authLoading, runOwnerCheck, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const returningToActive = previousState !== 'active' && nextState === 'active';
      if (!returningToActive || authLoading || !userId) return;

      runOwnerCheck(userId);
    });

    return () => subscription.remove();
  }, [authLoading, runOwnerCheck, userId]);

  const refreshOwnerAuthorization = useCallback(() => runOwnerCheck(userId), [runOwnerCheck, userId]);

  const value = useMemo(() => ({
    isOwner,
    isOwnerLoading,
    ownerAuthorizationError,
    refreshOwnerAuthorization,
  }), [isOwner, isOwnerLoading, ownerAuthorizationError, refreshOwnerAuthorization]);

  return (
    <OwnerAuthorizationContext.Provider value={value}>
      {children}
    </OwnerAuthorizationContext.Provider>
  );
}

export function useOwnerAuthorization() {
  const ctx = useContext(OwnerAuthorizationContext);
  if (!ctx) throw new Error('useOwnerAuthorization must be used within OwnerAuthorizationProvider');
  return ctx;
}
