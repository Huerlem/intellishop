// @/utils/globalErrorHandler.js
import { LogBox } from 'react-native';
import { handleError } from '@/errors/errorHandler';

export const initialize = () => {
  // Configura o manipulador global
  try {
    // Para promessas não tratadas
    const handlePromiseRejection = (id, reason) => {
      handleError(reason, {
        title: 'Promise Error',
        showAlert: true,
        logToAnalytics: true,
      });
    };

    // Registra o manipulador
    global.Promise = global.Promise || Promise;
    if (typeof global.Promise.onPossiblyUnhandledRejection === 'function') {
      global.Promise.onPossiblyUnhandledRejection(handlePromiseRejection);
    }

    console.log('Global error handler configured successfully');
  } catch (setupError) {
    console.error('Failed to set up global error handler:', setupError);
  }
};

// Função para ignorar avisos específicos
export const ignoreCommonWarnings = () => {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    // Adicione outros avisos para ignorar
  ]);
};