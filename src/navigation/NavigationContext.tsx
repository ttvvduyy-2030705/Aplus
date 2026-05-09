import React, {createContext, ReactNode, useContext, useMemo, useState} from 'react';
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

  const value = useMemo<NavigationValue>(() => ({
    currentRoute,
    stack,
    navigate: (name, params) => setStack(prev => [...prev, {name, params} as AppRoute]),
    reset: (name, params) => setStack([{name, params} as AppRoute]),
    goBack: () => setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev)),
    canGoBack: stack.length > 1,
  }), [currentRoute, stack]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useAplusNavigation() {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error('useAplusNavigation phải được dùng bên trong NavigationProvider');
  }
  return value;
}
