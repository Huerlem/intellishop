const params = Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] ?? ''));
const noop = () => {};
export const useRouter = () => ({ push: noop, replace: noop, back: noop, canGoBack: () => true, navigate: noop });
export const useLocalSearchParams = () => params;
export const Link = () => null;
export const Stack = Object.assign(() => null, { Screen: () => null });
