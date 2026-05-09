import React, {ReactNode} from 'react';
import {AppStateProvider} from '@/state/AppStateContext';
import {NavigationProvider} from '@/navigation/NavigationContext';

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <AppStateProvider>
      <NavigationProvider>{children}</NavigationProvider>
    </AppStateProvider>
  );
}
