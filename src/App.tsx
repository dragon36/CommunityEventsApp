// =============================================================================
// COMMUNITY EVENTS APP - ENTRY POINT
// =============================================================================

import React from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';

// -----------------------------------------------------------------------------
// ROOT COMPONENT
// -----------------------------------------------------------------------------

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;