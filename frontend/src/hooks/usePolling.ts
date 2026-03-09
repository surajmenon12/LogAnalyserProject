"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval: number;
  enabled: boolean;
  onData?: (data: T) => void;
  shouldStop?: (data: T) => boolean;
}

export function usePolling<T>({
  fetcher,
  interval,
  enabled,
  onData,
  shouldStop,
}: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(enabled);

  activeRef.current = enabled;

  const poll = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      onData?.(result);
      if (shouldStop?.(result)) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [fetcher, onData, shouldStop]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    // Immediate first poll
    poll();
    timerRef.current = setInterval(poll, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, interval, poll]);

  return { data, error };
}
