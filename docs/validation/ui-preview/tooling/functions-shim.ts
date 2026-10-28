export const getFunctions = () => ({});
export const connectFunctionsEmulator = () => {};
export const httpsCallable = () => async () => {
  throw Object.assign(new Error('preview'), { code: 'functions/unavailable' });
};
