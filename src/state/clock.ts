/**
 * Shared "now" for render-time date logic (expiry badges, signals, greeting). Reading the clock
 * during render is impure, so components subscribe to this store instead; it ticks once a minute.
 */
import { useSyncExternalStore } from 'react';

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(tick, 60_000);
    (timer as { unref?: () => void }).unref?.();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const snapshot = () => now;

export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
