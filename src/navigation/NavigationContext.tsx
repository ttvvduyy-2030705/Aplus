import React, {createContext, ReactNode, useCallback, useContext, useMemo, useState} from 'react';
import type {AppRoute, AppRouteName, AppRouteParams} from './routes';

type NavigationValue = {
  currentRoute: AppRoute;
  stack: AppRoute[];
  navigate: <T extends AppRouteName>(name: T, params?: AppRouteParams[T]) => void;
  reset: <T extends AppRouteName>(name: T, params?: AppRouteParams[T]) => void;
  goBack: () => void;
  canGoBack: boolean;
};

const NavigationContext = createContext<NavigationValue | undefined>(undefined);

export function NavigationProvider({children}: {children: ReactNode}) {
  const [stack, setStack] = useState<AppRoute[]>([{name: 'Splash', params: undefined}]);
  const currentRoute = stack[stack.length - 1];

  const navigate = useCallback(<T extends AppRouteName,>(name: T, params?: AppRouteParams[T]) => {
    setStack(prev => [...prev, {name, params} as AppRoute]);
  }, []);

  const reset = useCallback(<T extends AppRouteName,>(name: T, params?: AppRouteParams[T]) => {
    setStack(prev => {
      const current = prev[prev.length - 1];
      if (prev.length === 1 && current?.name === name && current?.params === params) {
        return prev;
      }
      return [{name, params} as AppRoute];
    });
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const value = useMemo<NavigationValue>(() => ({
    currentRoute,
    stack,
    navigate,
    reset,
    goBack,
    canGoBack: stack.length > 1,
  }), [currentRoute, goBack, navigate, reset, stack]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useAplusNavigation() {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error('useAplusNavigation phải được dùng bên trong NavigationProvider');
  }
  return value;
}
