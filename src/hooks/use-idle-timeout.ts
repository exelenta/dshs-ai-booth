"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSessionImages } from "@/lib/session-image-store";

export function useIdleTimeout(timeoutMs: number = 120000, redirectPath: string = "/") {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        sessionStorage.clear();
        await clearSessionImages();
        router.push(redirectPath);
      }, timeoutMs);
    };

    const events = [
      "mousemove",
      "mousedown",
      "touchstart",
      "touchmove",
      "keydown",
      "scroll",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [router, timeoutMs, redirectPath]);
}
