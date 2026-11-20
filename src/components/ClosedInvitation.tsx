import styles from "./invitation.module.css";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Shown on every link of a cancelled order (cancelled or refunded from the admin dashboard). */
export default function ClosedInvitation({ lang }: { lang: Lang }) {
  const s = t(lang);
  return (
    <main className={styles.closed} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div>
        <h1>{s.closedTitle}</h1>
        <p>{s.closedBody}</p>
      </div>
    </main>
  );
}
