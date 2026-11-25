"use client";

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./landing.module.css";

interface EntranceContextValue {
  heroRevealed: boolean;
  immediate: boolean;
  completeIntro: () => void;
}

const EntranceContext = createContext<EntranceContextValue>({
  heroRevealed: true,
  immediate: true,
  completeIntro: () => {},
});

const STANDARD_TIMING = { exitStartMs: 900, totalMs: 1600 };
const REDUCED_TIMING = { exitStartMs: 100, totalMs: 250 };

let hasPlayedInSession = false;

export function useLandingEntrance() {
  return useContext(EntranceContext);
}

export function LandingEntranceProvider({
  wordmark = "Naila",
  children,
}: {
  wordmark?: string;
  children: ReactNode;
}) {
  const [alreadyPlayed] = useState<boolean>(() =>
    typeof window !== "undefined" ? hasPlayedInSession : false
  );
  const [heroRevealed, setHeroRevealed] = useState<boolean>(alreadyPlayed);

  const completeIntro = useCallback(() => {
    hasPlayedInSession = true;
    setHeroRevealed(true);
  }, []);

  const value = useMemo(
    () => ({ heroRevealed, immediate: alreadyPlayed, completeIntro }),
    [heroRevealed, alreadyPlayed, completeIntro]
  );

  return (
    <EntranceContext.Provider value={value}>
      {!alreadyPlayed && <IntroCurtain wordmark={wordmark} />}
      {children}
    </EntranceContext.Provider>
  );
}

function charStyle(idx: number, reduced: boolean): CSSProperties | undefined {
  if (reduced) return undefined;
  return {
    animationDelay: `${(0.055 * idx).toFixed(3)}s`,
  };
}

function IntroCurtain({ wordmark }: { wordmark: string }) {
  const { completeIntro } = useContext(EntranceContext);
  const [reduced, setReduced] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);

    const timing = isReduced ? REDUCED_TIMING : STANDARD_TIMING;
    const tExit = window.setTimeout(() => setExiting(true), timing.exitStartMs);
    const tDone = window.setTimeout(() => {
      completeIntro();
      setVisible(false);
    }, timing.totalMs);

    return () => {
      window.clearTimeout(tExit);
      window.clearTimeout(tDone);
    };
  }, [completeIntro]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  let charIndex = 0;
  const tokens = wordmark.split(/(\s+)/).filter(Boolean);

  return (
    <div
      data-testid="landing-intro-curtain"
      data-exiting={exiting ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      className={styles.introCurtain}
      aria-hidden="true"
    >
      <span
        translate="no"
        dir="ltr"
        className={`notranslate ${styles.introWordmark}`}
      >
        {tokens.map((tok, ti) =>
          /^\s+$/.test(tok) ? (
            <Fragment key={`sp-${ti}`}>
              {Array.from(tok).map((ch) => {
                const i = charIndex++;
                return (
                  <span
                    key={`s-${i}`}
                    style={charStyle(i, reduced)}
                    className={`${styles.introSpace} ${
                      reduced ? "" : styles.introLetterAnim
                    }`}
                  >
                    {ch}
                  </span>
                );
              })}
            </Fragment>
          ) : (
            <span key={`wd-${ti}`} className={styles.introWord}>
              {Array.from(tok).map((ch) => {
                const i = charIndex++;
                return (
                  <span
                    key={`c-${i}`}
                    style={charStyle(i, reduced)}
                    className={`${styles.introChar} ${
                      reduced ? "" : styles.introLetterAnim
                    }`}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          )
        )}
      </span>
    </div>
  );
}
