"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Delay after sky names start revealing before the letter begins rising. */
export const AUTO_SCROLL_LEAD_MS = 650;
export const AUTO_SCROLL_CRUISE_PX_PER_SEC = 115;
export const AUTO_SCROLL_RAMP_IN_SEC = 0.9;
export const AUTO_SCROLL_RAMP_OUT_PX = 240;

const SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  " ",
  "Home",
  "End",
]);

interface UseInviteAutoScrollOptions {
  locked: boolean;
  resetTop: boolean;
}

/**
 * Locks page scrolling while the invitation threshold is sealed/opening, then
 * smoothly auto-scrolls down through the invitation until the guest takes over
 * or the farewell reaches the bottom of `pageRef`.
 */
export function useInviteAutoScroll(
  pageRef: RefObject<HTMLElement | null>,
  { locked, resetTop }: UseInviteAutoScrollOptions,
) {
  const rafRef = useRef<number>(undefined);
  const startedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  useEffect(() => {
    if (!locked) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = html.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    if (resetTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    const blockTouchOrWheel = (e: Event) => {
      e.preventDefault();
    };
    const blockScrollKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", blockTouchOrWheel, { passive: false });
    window.addEventListener("touchmove", blockTouchOrWheel, { passive: false });
    window.addEventListener("keydown", blockScrollKeys);

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevOverscroll;
      window.removeEventListener("wheel", blockTouchOrWheel);
      window.removeEventListener("touchmove", blockTouchOrWheel);
      window.removeEventListener("keydown", blockScrollKeys);
    };
  }, [locked, resetTop]);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const html = document.documentElement;
    html.style.overflow = "";
    document.body.style.overflow = "";
    html.style.overscrollBehavior = "";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const onUserTakeover = () => stopAutoScroll();
    const onPointerTakeover = (e: PointerEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest("[data-keep-autoscroll]")
      ) {
        return;
      }
      stopAutoScroll();
    };
    const onKeyTakeover = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) {
        stopAutoScroll();
      }
    };

    window.addEventListener("wheel", onUserTakeover, { passive: true });
    window.addEventListener("touchstart", onUserTakeover, { passive: true });
    window.addEventListener("pointerdown", onPointerTakeover, { passive: true });
    window.addEventListener("keydown", onKeyTakeover);

    cleanupRef.current = () => {
      html.style.scrollBehavior = prevScrollBehavior;
      window.removeEventListener("wheel", onUserTakeover);
      window.removeEventListener("touchstart", onUserTakeover);
      window.removeEventListener("pointerdown", onPointerTakeover);
      window.removeEventListener("keydown", onKeyTakeover);
    };

    rafRef.current = requestAnimationFrame(() => {
      let y = window.scrollY;
      let lastWrittenY = y;
      const startTime = performance.now();
      let lastTime = startTime;

      const step = (now: number) => {
        if (Math.abs(window.scrollY - lastWrittenY) > 12) {
          stopAutoScroll();
          return;
        }

        const main = pageRef.current;
        if (!main) {
          stopAutoScroll();
          return;
        }

        const maxDocScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const mainEnd = main.offsetTop + main.offsetHeight - window.innerHeight;
        const targetY = Math.max(0, Math.min(maxDocScroll, mainEnd));
        const remaining = targetY - y;

        if (remaining <= 1) {
          window.scrollTo({ top: targetY, behavior: "instant" });
          stopAutoScroll();
          return;
        }

        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        const elapsed = (now - startTime) / 1000;
        const rIn = Math.min(1, elapsed / AUTO_SCROLL_RAMP_IN_SEC);
        const rampIn = rIn * rIn * (3 - 2 * rIn);
        const rampOut =
          remaining < AUTO_SCROLL_RAMP_OUT_PX
            ? Math.max(0.08, remaining / AUTO_SCROLL_RAMP_OUT_PX)
            : 1;

        y = Math.min(
          targetY,
          y + AUTO_SCROLL_CRUISE_PX_PER_SEC * rampIn * rampOut * dt,
        );
        lastWrittenY = y;
        window.scrollTo({ top: y, behavior: "instant" });
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    });
  }, [pageRef, stopAutoScroll]);

  return { startAutoScroll, stopAutoScroll };
}
