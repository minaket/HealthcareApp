import React, { useEffect } from 'react';
import { startPeriodicIPChecks } from './src/utils/network';

export default function App() {
  useEffect(() => {
    // Start periodic IP checks and get cleanup function
    const cleanup = startPeriodicIPChecks();

    // Cleanup on unmount
    return cleanup;
  }, []);

  // ... rest of the component ...
} 