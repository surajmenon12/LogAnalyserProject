"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SESSION_TIMEOUT_MS } from "@/constants";
import { clearSession } from "@/lib/session";

export function useSessionTimeout(active: boolean) {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!active) return;
    timerRef.current = setTimeout(() => {
      setShowModal(true);
    }, SESSION_TIMEOUT_MS);
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => resetTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, resetTimer]);

  const handleTimeout = useCallback(() => {
    clearSession();
    setShowModal(false);
    window.location.reload();
  }, []);

  return { showModal, handleTimeout };
}
