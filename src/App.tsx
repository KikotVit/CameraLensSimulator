import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CameraScreen } from './screens/CameraScreen';

export const App = () => (
  <SafeAreaProvider>
    <CameraScreen />
  </SafeAreaProvider>
);
