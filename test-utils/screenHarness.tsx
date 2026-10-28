/**
 * Harness for V2 screen tests: real AppDataProvider and repositories over the in-memory
 * Firestore, a stub router and a stub signed-in user. TEST USE ONLY.
 *
 * Each test file must declare (jest.mock is hoisted per file):
 *   jest.mock('firebase/firestore', () => require('../../test-utils/memoryFirestore').firestoreModule);
 *   jest.mock('firebase/functions', () => require('../../test-utils/screenMocks').functionsModule);
 *   jest.mock('@/firebase/config', () => require('../../test-utils/screenMocks').firebaseConfig);
 *   jest.mock('@/hooks/useAuth', () => require('../../test-utils/screenMocks').authModule);
 *   jest.mock('expo-router', () => require('../../test-utils/screenMocks').routerModule);
 *   jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
 */
import type { ReactElement } from 'react';

import { AppDataProvider } from '@/src/state/AppDataProvider';

export * from './screenMocks';

export function withData(ui: ReactElement) {
  return <AppDataProvider>{ui}</AppDataProvider>;
}
