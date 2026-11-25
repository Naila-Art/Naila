"use client";

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

interface CardEntry {
  ratio: number;
  rect: DOMRectReadOnly | null;
  hovered: boolean;
  active: boolean;
  setActive: (active: boolean) => void;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

const entries = new Map<Element, CardEntry>();
let observer: IntersectionObserver | null = null;
let reconcileTimer: number | null = null;
let listenersAttached = false;

const IO_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 0.95];
const RECONCILE_DELAY_MS = 160;

function canAutoplay(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (document.hidden) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
    return false;
  }
  return true;
}

function maxActiveSlots(): number {
  const w = window.innerWidth || 1024;
  if (w < 640) return 1;
  if (w < 1024) return 2;
  if (w < 1280) return 3;
  return 4;
}

function deactivateAll() {
  for (const entry of entries.values()) {
    if (entry.active) {
      entry.active = false;
      entry.setActive(false);
    }
  }
}

function clearReconcileTimer() {
  if (reconcileTimer !== null) {
    window.clearTimeout(reconcileTimer);
    reconcileTimer = null;
  }
}

function reconcile() {
  clearReconcileTimer();
  if (!canAutoplay()) {
    deactivateAll();
    return;
  }

  const vw = window.innerWidth || 1024;
  const vh = window.innerHeight || 768;
  const isMobile = vw < 640;
  const minRatio = isMobile ? 0.45 : 0.35;

  let candidates = Array.from(entries.entries()).filter(
    ([, entry]) => entry.hovered || entry.ratio >= minRatio
  );
  if (isMobile && candidates.length === 0) {
    candidates = Array.from(entries.entries()).filter(
      ([, entry]) => entry.ratio >= 0.25
    );
  }

  const scored = candidates
    .map(([el, entry]) => {
      const liveRect = el.getBoundingClientRect();
      const rect =
        liveRect.width > 0 || liveRect.height > 0 ? liveRect : entry.rect;
      const dx = rect ? Math.abs(rect.left + rect.width / 2 - vw / 2) / vw : 1;
      const dy = rect ? Math.abs(rect.top + rect.height / 2 - vh / 2) / vh : 1;
      let score = entry.ratio - dy * 0.9 - dx * (isMobile ? 1.1 : 0.25);
      if (entry.hovered) score += 10;
      if (entry.active) score += 0.08;
      return { el, score };
    })
    .sort((a, b) => b.score - a.score);

  const limit = maxActiveSlots();
  const nextActive = new Set(scored.slice(0, limit).map((item) => item.el));

  for (const [el, entry] of entries.entries()) {
    const shouldBeActive = nextActive.has(el);
    if (entry.active !== shouldBeActive) {
      entry.active = shouldBeActive;
      entry.setActive(shouldBeActive);
    }
  }
}

function scheduleReconcile() {
  clearReconcileTimer();
  reconcileTimer = window.setTimeout(reconcile, RECONCILE_DELAY_MS);
}

function onVisibilityChange() {
  if (document.hidden) {
    clearReconcileTimer();
    deactivateAll();
  } else {
    reconcile();
  }
}

function onResize() {
  scheduleReconcile();
}

function ensureCoordinator() {
  if (typeof window === "undefined") return;
  if (!observer) {
    observer = new IntersectionObserver(
      (ioEntries) => {
        for (const ioEntry of ioEntries) {
          const entry = entries.get(ioEntry.target);
          if (!entry) continue;
          entry.ratio = ioEntry.intersectionRatio;
          entry.rect = ioEntry.boundingClientRect;
          if (entry.active && ioEntry.intersectionRatio === 0) {
            entry.active = false;
            entry.setActive(false);
          }
        }
        scheduleReconcile();
      },
      { threshold: IO_THRESHOLDS }
    );
  }
  if (!listenersAttached) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", onResize, { passive: true });
    listenersAttached = true;
  }
}

function teardownCoordinatorIfIdle() {
  if (entries.size > 0) return;
  clearReconcileTimer();
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (listenersAttached) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("resize", onResize);
    listenersAttached = false;
  }
}

const noopPointer = () => {};

/**
 * Coordinates viewport-gated card video playback across all showcase grids
 * so only the visible row (desktop) or centered card (mobile) decodes video.
 */
export function useCardAutoplay(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean
): {
  shouldPlay: boolean;
  onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => void;
} {
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) {
      setShouldPlay(false);
      return;
    }

    ensureCoordinator();
    const entry: CardEntry = {
      ratio: 0,
      rect: null,
      hovered: false,
      active: false,
      setActive: setShouldPlay,
    };
    entries.set(el, entry);
    observer?.observe(el);

    return () => {
      observer?.unobserve(el);
      entries.delete(el);
      setShouldPlay(false);
      teardownCoordinatorIfIdle();
      if (entries.size > 0) scheduleReconcile();
    };
  }, [ref, enabled]);

  const onPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || e.pointerType !== "mouse") return;
      const el = ref.current;
      const entry = el ? entries.get(el) : undefined;
      if (!entry) return;
      entry.hovered = true;
      reconcile();
    },
    [ref, enabled]
  );

  const onPointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || e.pointerType !== "mouse") return;
      const el = ref.current;
      const entry = el ? entries.get(el) : undefined;
      if (!entry) return;
      entry.hovered = false;
      reconcile();
    },
    [ref, enabled]
  );

  if (!enabled) {
    return {
      shouldPlay: false,
      onPointerEnter: noopPointer,
      onPointerLeave: noopPointer,
    };
  }

  return { shouldPlay, onPointerEnter, onPointerLeave };
}
