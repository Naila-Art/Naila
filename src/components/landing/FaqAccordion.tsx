"use client";

import { useState } from "react";
import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface FaqAccordionProps {
  copy: LandingCopy;
}

export default function FaqAccordion({ copy }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="landing-faq-title"
      data-header-tone="dark"
      className={styles.faqSection}
    >
      <div className={styles.faqGrid}>
        {/* Sticky Left Column */}
        <div className={styles.faqStickyCol}>
          <h2 id="landing-faq-title" className={styles.faqH2}>
            {copy.faq.title}
          </h2>
        </div>

        {/* Right Editorial Numbered Accordion */}
        <ol className={styles.faqList}>
          {copy.faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const num = String(idx + 1).padStart(2, "0");
            const panelId = `faq-panel-${idx}`;
            const triggerId = `faq-trigger-${idx}`;

            return (
              <li
                key={item.question}
                data-state={isOpen ? "open" : "closed"}
                className={styles.faqItem}
              >
                <h3>
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className={styles.faqTrigger}
                  >
                    <span aria-hidden="true" className={styles.faqNum}>
                      {num}
                    </span>
                    <span className={styles.faqQuestion}>{item.question}</span>
                    <span aria-hidden="true" className={styles.faqPlusCircle}>
                      <span className={styles.faqBarHoriz} />
                      <span
                        className={styles.faqBarVert}
                        style={{ transform: isOpen ? "scaleY(0)" : "scaleY(1)" }}
                      />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`${styles.faqPanelGrid} ${
                    isOpen ? styles.faqPanelOpen : ""
                  }`}
                >
                  <div className={styles.faqPanelOverflow}>
                    <div className={styles.faqAnswerGrid}>
                      <p className={styles.faqAnswer}>{item.answer}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
