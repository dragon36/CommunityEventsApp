// =============================================================================
// COMMUNITY EVENTS APP - ENTRY POINT
// =============================================================================

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { AppInnerContent } from '@/components/AppContent';

// -----------------------------------------------------------------------------
// ROOT COMPONENT
// -----------------------------------------------------------------------------

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInnerContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;